import {
  getRequestStarInfoMsg,
  getStarInfoMsg,
  packetHeaders,
  getNewCodexCidMsg,
  getRequestStarPropertiesMsg,
  getStarPropertiesMsg,
} from "./protocol.js";
import { StarInfo } from "./starInfo.js";

export class StarChannel {
  constructor(core, starId, handler) {
    this._core = core;
    this._starId = starId;
    this._logger = this._core.logger.prefix("StarChannel");
    this._handler = handler;

    this._handlerMap = {};
    this._handlerMap[packetHeaders.requestStarInfo] =
      this._handleRequestStarInfo;
    this._handlerMap[packetHeaders.requestStarProperties] =
      this._handleRequestStarProperties;
    this._handlerMap[packetHeaders.starInfo] = this._handleStarInfo;
    this._handlerMap[packetHeaders.starProperties] = this._handleStarProperties;
    this._handlerMap[packetHeaders.newCodexCid] = this._handleNewCodexCid;
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

  sendRequestStarInfo = async () => {
    this._logger.trace("sendRequestStarInfo: Requesting StarInfo...");
    await this._channel.send(getRequestStarInfoMsg());
  };

  sendRequestStarProperties = async () => {
    this._logger.trace(
      "sendRequestStarProperties: Requesting StarProperties...",
    );
    await this._channel.send(getRequestStarPropertiesMsg());
  };

  sendStarInfo = async (starInfo) => {
    this._logger.trace("sendStarInfo: Sending StarInfo...");
    await this._channel.send(getStarInfoMsg(starInfo));
  };

  sendStarProperties = async (json) => {
    this._logger.trace("sendStarProperties: Sending StarProperties...");
    await this._channel.send(getStarPropertiesMsg(json));
  };

  sendNewCid = async (cid) => {
    this._logger.trace(`sendNewCid: '${cid}'`);
    await this._channel.send(getNewCodexCidMsg(cid));
  };

  onMessage = async (signer, timestamp, msg) => {
    const packet = this._parsePacket(msg);
    this._logger.trace("onMessage: Packet received: " + JSON.stringify(packet));

    try {
      const handler = this._handlerMap[packet.header];
      await handler(signer, timestamp, packet);
    } catch (error) {
      this._logger.errorAndThrow("onMessage: Error when handling message: " + error);
    }
  };

  _handleRequestStarInfo = async (signer, timestamp, packet) => {
    const diffTimeMs = Math.abs(new Date() - timestamp);
    if (diffTimeMs > 5000) {
      this._logger.trace(
        "_handleRequestStarInfo: Received starInfo request but it's too old: " +
          diffTimeMs,
      );
      return;
    }

    await this._handler.onRequestStarInfo();
  };

  _handleRequestStarProperties = async (signer, timestamp, packet) => {
    const diffTimeMs = Math.abs(new Date() - timestamp);
    if (diffTimeMs > 5000) {
      this._logger.trace(
        "_handleRequestStarProperties: Received starProperties request but it's too old: " +
          diffTimeMs,
      );
      return;
    }

    await this._handler.onRequestStarProperties();
  };

  _handleStarInfo = async (signer, timestamp, packet) => {
    const candidateStarInfo = new StarInfo(
      this._core,
      packet.starInfo.type,
      packet.starInfo.owners,
      packet.starInfo.creationUtc,
    );

    // star info id must match id that was used to open the channel.
    if (this._starId != candidateStarInfo.starId) {
      this._logger.trace(
        "_handleStarInfo: candidate rejected: starId did not match.",
      );
      return;
    }

    // star info must be signed by owner if owners is not empty.
    // TODO! "signer" in this case is the sender of the message.
    // This means only the owner can send the starInfo message, which we don't want.
    // We want other nodes to be able to send the info message as long as it was originally
    // signed by an owner.
    if (candidateStarInfo.owners && candidateStarInfo.owners.length > 0) {
      if (!candidateStarInfo.owners.includes(signer)) {
        this._logger.trace(
          "_handleStarInfo: candidate rejected: not signed by owner.",
        );
        return;
      }
    }

    await this._handler.onStarInfo(candidateStarInfo);
  };

  _handleStarProperties = async (signer, timestamp, packet) => {
    const json = packet.starProperties;
    await this._handler.onStarProperties(signer, json);
  };

  _handleNewCodexCid = async (signer, timestamp, packet) => {
    await this._handler.onNewCid(signer, packet.cdxCid);
  };

  _parsePacket = (msg) => {
    try {
      const packet = JSON.parse(msg);
      if (packet) return packet;
    } catch {}
    this._logger.trace(`Unparsable packet received: '${msg}'`);
  };
}
