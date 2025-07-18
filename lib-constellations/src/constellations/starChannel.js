import {
  constellationsProtocolVersion,
  starIdToContentTopic,
} from "./protocol.js";

export class StarChannel {
  constructor(core, starId) {
    this._core = core;
    this._starId = starId;
    this._logger = this._core.logger.prefix("StarChannel");
  }

  open = async (handler) => {
    if (this._channel) this._logger.assert("open: Already open");
    if (!handler) this._logger.assert("open: handler not provided.");

    this._logger.trace("open: Opening...");
    this._handler = handler;
    const topic = starIdToContentTopic(this._starId);
    this._channel = await this._core.wakuService.openChannel(topic, this);
    await this._channel.start();
  };

  close = async () => {
    if (!this._channel) this._logger.assert("open: Already closed");

    this._logger.trace("close: Closing...");
    await this._channel.close();

    this._core = null;
    this._starId = null;
    this._logger = null;
    this._handler = null;
    this._channel = null;
  };

  sendPacket = async (packet) => {
    if (!this._channel)
      this._logger.errorAndThrow("sendPacket: Channel not open");
    if (!packet.header)
      this._logger.errorAndThrow("sendPacket: Packet must have a header");

    packet.version = constellationsProtocolVersion;
    await this._channel.send(JSON.stringify(packet));
  };

  onMessage = async (signer, timestamp, msg) => {
    const packet = this._parsePacket(msg);
    if (!packet) return;
    if (!packet.version || packet.version != constellationsProtocolVersion) {
      this.logger.warn(
        `onMessage: Packet ignored, wrong version: '${packet.version}'`,
      );
      return;
    }

    this._logger.trace(
      `onMessage: Packet received from '${signer}': '${JSON.stringify(packet)}'`,
    );
    try {
      await this._handler.onPacket(signer, packet);
    } catch (error) {
      this._logger.errorAndThrow(
        "onMessage: Error when handling message: " + error,
      );
    }
  };

  _parsePacket = (msg) => {
    try {
      const packet = JSON.parse(msg);
      if (packet) return packet;
    } catch {}
    this._logger.warn(`_parsePacket: Unparsable message received: '${msg}'`);
  };
}
