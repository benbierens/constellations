import { packetHeaders } from "./protocol";

class HealthMetric {
  constructor(
    name,
    core,
    logger,
    channel,
    header,
    requiredPayload,
    checkCanSend,
  ) {
    this._name = name;
    this._core = core;
    this._logger = logger.prefix(name);
    this._channel = channel;
    this._header = header;
    this._requiredPayload = requiredPayload;
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

    if (this._requiredPayload && packet.payload != this._requiredPayload) {
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
    if (!(await this._check())) {
      this._logger.trace("trySendNow: Denied by canSendCheck");
      return;
    }

    if (this._requiredPayload) {
      await this._channel.sendPacket({
        header: this._header,
        payload: this._requiredPayload,
      });
    } else {
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
  constructor(core, channel) {
    this._core = core;
    this._logger = core.logger.prefix("Health");

    this._channel = channel;

    const channelRequiredPayload = null;
    this._channelMetric = new HealthMetric(
      "CHN",
      core,
      this._logger,
      this._channel,
      packetHeaders.healthChannel,
      channelRequiredPayload,
      this._checkCanSendChannel,
    );
  }

  start = async (starConfig) => {
    await this._channelMetric.start(
      starConfig.channelMonitoringMinutes * millisecondsPerMinute,
    );
  };

  stop = async () => {
    await this._channelMetric.stop();
  };

  onPacket = async (sender, packet) => {
    if (await this._channelMetric.onPacket(sender, packet)) return true;

    return false;
  };

  get channelHealth() {
    return {
      count: this._channelMetric.count,
      lastUpdate: this._channelMetric.lastUpdate,
    };
  }

  _checkCanSendChannel = async () => {
    return true; // We're in the channel, so can always send.
  };
}
