import {
  constellationsProtocolVersion,
} from "./protocol.js";

export class StarChannel {
  constructor(core, starId, handler) {
    this._core = core;
    this._starId = starId;
    this._logger = this._core.logger.prefix("StarChannel");
    this._handler = handler;
  }

  close = async () => {
    this._logger.trace("close: Closing...");
    await this._channel.close();

    this._core = null;
    this._starId = null;
    this._logger = null;
    this._handler = null;
    this._channel = null;
  };

  sendPacket = async (packet) => {
    this._logger.trace("sendPacket: Sending...");

    packet.version = constellationsProtocolVersion;
    await this._channel.send(JSON.stringify(packet));
  };

  onMessage = async (signer, timestamp, msg) => {
    const packet = this._parsePacket(msg);
    if (!packet) return;
    if (!packet.version || packet.version != constellationsProtocolVersion) {
      this.logger.warn(`onMessage: Packet ignored, wrong version: '${packet.version}'`);
      return;
    }

    this._logger.trace("onMessage: Packet received: " + JSON.stringify(packet));
    try {
      await this._handler.onPacket(packet);
    } catch (error) {
      this._logger.errorAndThrow("onMessage: Error when handling message: " + error);
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
