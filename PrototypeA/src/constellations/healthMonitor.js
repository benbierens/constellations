import { packetHeaders } from "./protocol";

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

    this._timer = null;
    this._idsReceived = [];
    this._count = 0;
    this._lastCycleUtc = new Date(0);
  }

  start = async (interval) => {
    this._idsReceived = [];
    this._count = 0;
    this._lastCycleUtc = new Date(0);

    if (this._timer) this._logger.assert("start: Already started");
    this._timer = this._core.timerService.createAndStart(
      `health_${this._name}`,
      this._onTimer,
      interval,
    );

    await this.trySendNow();
  };

  stop = async () => {
    if (!this._timer) this._logger.assert("stop: Not started");
    await this._timer.stop();
    this._timer = null;
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

    if (this._idsReceived.length >= 99) {
      this._logger.trace("onPacket: Ignored, health count at max.");
      return true;
    }

    if (this._idsReceived.includes(sender)) {
      this._logger.trace("onPacket: Ignored, already known");
      return true;
    }

    this._idsReceived.push(sender);
    this._logger.trace("onPacket: New sender added");
    return true;
  };

  trySendNow = async () => {
    this._logger.trace("trySendNow: checking...");

    if (!(await this._check())) {
      this._logger.trace("trySendNow: Denied by canSendCheck");
      return;
    }
this._logger.trace("trySendNow: payload...");
    
    const requiredPayload = this._getRequiredPayload();
    if (requiredPayload) {
      this._logger.trace("trySendNow: send with payload...");
    
      await this._channel.sendPacket({
        header: this._header,
        payload: requiredPayload,
      });
    } else {
      this._logger.trace("trySendNow: send without payload...");
    
      await this._channel.sendPacket({
        header: this._header,
      });
    }

    this._logger.trace("trySendNow: Packet sent");
  };

  _onTimer = async () => {
    this._lastCycleUtc = new Date();
    this._count = this._idsReceived.length;
    this._idsReceived = [];
    await this.trySendNow();
    this._logger.trace("_onTimer: Cycle completed");
  };
}

const millisecondsPerMinute = 1000 * 60;

export class HealthMonitor {
  constructor(core, channel, cidTracker) {
    this._core = core;
    this._logger = core.logger.prefix("Health");
    this._channel = channel;
    this._cidTracker = cidTracker;

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
    // await this._channelMetric.start(
    //   starConfig.channelMonitoringMinutes * millisecondsPerMinute,
    // );
    // await this._cidMetric.start(
    //   starConfig.cidMonitoringMinutes * millisecondsPerMinute,
    // );
  };

  stop = async () => {
    // await this._channelMetric.stop();
    // await this._cidMetric.stop();
  };

  onPacket = async (sender, packet) => {
    if (await this._channelMetric.onPacket(sender, packet)) return true;
    if (await this._cidMetric.onPacket(sender, packet)) return true;

    return false;
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
    if (this._cidTracker.cid && this._cidTracker.have) {
      return true;
    }
    return false;
  };
}
