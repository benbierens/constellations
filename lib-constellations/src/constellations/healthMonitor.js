import { packetHeaders } from "./protocol";

const healthCountMax = 99;

class HealthMetric {
  constructor(
    name,
    core,
    logger,
    channel,
    header,
    getRequiredPayload,
    checkCanSend,
  ) {
    this._name = name;
    this._core = core;
    this._logger = logger.prefix(name);
    this._channel = channel;
    this._header = header;
    this._getRequiredPayload = getRequiredPayload;
    this._check = checkCanSend;

    this._refreshTimer = null;
    this._resendTimer = null;
    this._idsReceived = [];
    this._count = 0;
    this._lastCycleUtc = new Date(0);
  }

  start = async (interval) => {
    this._idsReceived = [];
    this._count = 0;
    this._lastCycleUtc = new Date(0);

    if (this._refreshTimer)
      this._logger.assert("start: Refresh timer already started");
    this._refreshTimer = this._core.timerService.createAndStart(
      `hRefresh_${this._name}`,
      this._onRefreshTimer,
      interval,
    );
    if (this._resendTimer)
      this._logger.assert("start: Resend timer already started");
    this._resendTimer = this._core.timerService.createAndStart(
      `hResend_${this._name}`,
      this._onResendTimer,
      interval * this._getResendIntervalFactor(),
    );

    await this.trySendNow();
  };

  stop = async () => {
    if (!this._refreshTimer)
      this._logger.assert("stop: Refresh timer not started");
    await this._refreshTimer.stop();
    this._refreshTimer = null;

    if (!this._resendTimer)
      this._logger.assert("stop: Resend timer not started");
    await this._resendTimer.stop();
    this._resendTimer = null;
  };

  get count() {
    return this._count;
  }

  get lastUpdate() {
    return this._lastCycleUtc;
  }

  onPacket = async (sender, packet) => {
    if (packet.header != this._header) return false;

    const requiredPayload = this._getRequiredPayload();
    if (requiredPayload && packet.payload != requiredPayload) {
      this._logger.trace("onPacket: Ignored, required payload absent");
      return true;
    }

    if (this._idsReceived.length >= healthCountMax) {
      this._logger.trace("onPacket: Ignored, health count at max.");
      return true;
    }

    if (this._idsReceived.includes(sender)) {
      // Ignored, already known
      return true;
    }

    this._idsReceived.push(sender);
    this._logger.trace(
      `onPacket: New sender added. next count: ${this._idsReceived.length}`,
    );
    return true;
  };

  trySendNow = async () => {
    if (this._idsReceived.length >= healthCountMax) {
      this._logger.trace("trySendNow: Ignored, health count at max.");
      return;
    }

    if (!(await this._check())) {
      this._logger.trace("trySendNow: Denied by canSendCheck");
      return;
    }

    const requiredPayload = this._getRequiredPayload();
    if (requiredPayload) {
      await this._channel.sendPacket({
        header: this._header,
        payload: requiredPayload,
      });
    } else {
      await this._channel.sendPacket({
        header: this._header,
      });
    }
  };

  _getResendIntervalFactor = () => {
    // The metric refreshes every <interval>. The new value is the number of unique packets
    // received during this time. We send those packets slightly faster than <interval>
    // to make sure we will be include in the count.
    // If we send twice during the same cycle, no problem: the duplicate is ignored.
    return 0.9;
  };

  _onRefreshTimer = async () => {
    this._lastCycleUtc = new Date();
    this._count = this._idsReceived.length;
    this._idsReceived = [];
    this._logger.trace(
      `_onRefreshTimer: Health value updated to ${this._count}`,
    );
  };

  _onResendTimer = async () => {
    await this.trySendNow();
    this._logger.trace("_onResendTimer: Send cycle");
  };
}

const millisecondsPerMinute = 1000 * 60;

export class DoNothingHealthMonitor {
  // The DoNothingHealthMonitor is used by StarInternal to handle
  // Health related packets before a functional health monitor has
  // been initialized.
  onPacket = async (sender, packet) => {
    if (packet.header == packetHeaders.healthChannel) return true;
    if (packet.header == packetHeaders.healthCid) return true;
    return false;
  };

  stop = async () => {};

  get health() {
    return {};
  }
}

export class HealthMonitor {
  constructor(core, logger, channel, cidTracker) {
    this._core = core;
    this._logger = logger.prefix("Health");
    this._channel = channel;
    this._cidTracker = cidTracker;
    this._cidTracker.setHealthMonitor(this);

    this._channelMetric = new HealthMetric(
      "CHN",
      core,
      this._logger,
      this._channel,
      packetHeaders.healthChannel,
      this._getChannelRequiredPayload,
      this._checkCanSendChannel,
    );

    this._cidMetric = new HealthMetric(
      "CID",
      core,
      this._logger,
      this._channel,
      packetHeaders.healthCid,
      this._getCidRequiredPayload,
      this._checkCanSendCid,
    );
  }

  start = async (starConfig) => {
    await this._channelMetric.start(
      starConfig.channelMonitoringMinutes * millisecondsPerMinute,
    );
    await this._cidMetric.start(
      starConfig.cidMonitoringMinutes * millisecondsPerMinute,
    );
  };

  stop = async () => {
    await this._channelMetric.stop();
    await this._cidMetric.stop();
  };

  onPacket = async (sender, packet) => {
    if (await this._channelMetric.onPacket(sender, packet)) return true;
    if (await this._cidMetric.onPacket(sender, packet)) return true;

    return false;
  };

  trySendCidNow = async () => {
    await this._cidMetric.trySendNow();
  };

  get health() {
    return {
      channel: {
        count: this._channelMetric.count,
        lastUpdate: this._channelMetric.lastUpdate,
      },
      cid: {
        count: this._cidMetric.count,
        lastUpdate: this._cidMetric.lastUpdate,
      },
    };
  }

  _getChannelRequiredPayload = () => {
    return null;
  };

  _checkCanSendChannel = () => {
    return true; // We're in the channel, so can always send.
  };

  _getCidRequiredPayload = () => {
    const cid = this._cidTracker.cid;
    if (!cid) return "_cid_not_initialized_";
    return cid;
  };

  _checkCanSendCid = () => {
    // Check that the CID is known, and that we have it stored.
    if (!this._cidTracker.cid) {
      this._logger.trace("Tracker has no cid");
      return false;
    }

    if (!this._cidTracker.have) {
      this._logger.trace("Tracker has not fetched the data");
      return false;
    }

    return true;
  };
}
