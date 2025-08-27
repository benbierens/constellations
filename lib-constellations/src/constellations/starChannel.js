import {
  constellationsProtocolVersion,
  starIdToContentTopic,
} from "./protocol.js";
import { Lock } from "../services/lock.js";

export class StarChannel {
  constructor(core, starId) {
    this._core = core;
    this._starId = starId;
    this._logger = this._core.logger.prefix("StarChannel");
    this._onPacketLock = new Lock("PacketLock:" + starId);
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
    const logger = this._logger; // The async behaviour here might see the channel close
    // and the logger set to null before we're done with it. So we grab it locally.

    if (!this._channel)
      logger.errorAndThrow("sendPacket: Channel not open");
    if (!packet.header)
      logger.errorAndThrow("sendPacket: Packet must have a header");

    packet.version = constellationsProtocolVersion;

    const time1 = new Date();
    await this._channel.send(JSON.stringify(packet));
    const time2 = new Date();
    this._monitorDuration("sendPacket: _channel.send", time2.getTime() - time1.getTime(), logger);
  };

  onMessage = async (signer, timestamp, msg) => {
    const packet = this._parsePacket(msg);
    const logger = this._logger; // The async behaviour here might see the channel close
    // and the logger set to null before we're done with it. So we grab it locally.

    if (!packet) return;
    if (!packet.version || packet.version != constellationsProtocolVersion) {
      logger.warn(
        `onMessage: Packet ignored, wrong version: '${packet.version}'`,
      );
      return;
    }

    logger.trace(
      `onMessage: Begin processing packet received from '${signer}': '${JSON.stringify(packet)}'`,
    );
    try {
      const time1 = new Date();
      await this._onPacketLock.lock(async () => {
        if (this._handler) {
          await this._handler.onPacket(signer, packet);
        }
      });
      const time2 = new Date();
      this._monitorDuration("onMessage: _handler.onPacket", time2.getTime() - time1.getTime(), logger);
    } catch (error) {
      logger.errorAndThrow(
        "onMessage: Error when handling message: " + error,
      );
    }
    logger.trace(
      `onMessage: Finished processing packet received from '${signer}': '${JSON.stringify(packet)}'`,
    );
  };

  _parsePacket = (msg) => {
    try {
      const packet = JSON.parse(msg);
      if (packet) return packet;
    } catch {}
    this._logger.warn(`_parsePacket: Unparsable message received: '${msg}'`);
  };

  _monitorDuration = (name, durationMs, logger) => {
    if (durationMs > 30000) {
      logger.errorAndThrow(`${name}: Unacceptably long call duration: ${durationMs} ms`);
    }
    else if (durationMs > 1000) {
      logger.warn(`${name}: Long call duration: ${durationMs} ms`);
    }
  }
}
