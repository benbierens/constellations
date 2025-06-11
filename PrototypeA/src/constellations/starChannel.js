import {
  getRequestStarInfoMsg,
  getStarInfoMsg,
  packetHeaders,
  getNewCodexCidMsg,
} from "./protocol.js";

export class StarChannel {
  constructor(core, starId, handler) {
    this.core = core;
    this.starId = starId;
    this.logger = this.core.logger.prefix("StarChannel");
    this.handler = handler;

    this._starInfo = null;
  }

  close = async () => {
    this.logger.trace("close: Closing...");
    await this.channel.close();

    this.core = null;
    this.starId = null;
    this.logger = null;
    this.handler = null;
    this._starInfo = null;
  };

  getStarInfo = async () => {
    // did we already receive it?
    if (this._starInfo) return this._starInfo;

    // wait for it?
    await this.core.sleep(1000);
    if (this._starInfo) return this._starInfo;

    // ask for it?
    this.logger.trace("getStarInfo: Requesting StarInfo for channel...");
    await this.channel.send(getRequestStarInfoMsg());
    await this.core.sleep(1000);
    if (this._starInfo) return this._starInfo;
    await this.core.sleep(1000);
    if (this._starInfo) return this._starInfo;

    // Trace: this is part of the normal flow when setting up a new channel.
    this.logger.trace(
      "getStarInfo: Did not get starInfo from channel. Request was not answered.",
    );
    return null;
  };

  setStarInfo = async (starInfo) => {
    if (this._starInfo)
      this.logger.errorAndThrow(
        "getStarInfo: StarInfo already known for this channel.",
      );

    this._starInfo = starInfo;
    await this._sendStarInfo();
  };

  setNewCid = async (cid) => {
    this.logger.trace(`setNewCid: '${cid}'`);
    await this.channel.send(getNewCodexCidMsg(cid));
  };

  onMessage = async (signer, timestamp, msg) => {
    const packet = this._parsePacket(msg);
    this.logger.trace("onMessage: Packet received: " + JSON.stringify(packet));

    if (packet.header == packetHeaders.requestStarInfo) {
      await this._handleRequestStarInfo(timestamp);
    } else if (packet.header == packetHeaders.starInfo) {
      this._handleStarInfo(signer, packet);
    } else if (packet.header == packetHeaders.newCodexCid) {
      await this._handleNewCodexCid(signer, packet);
    }
  };

  _sendStarInfo = async () => {
    if (!this._starInfo)
      this.logger.errorAndThrow("_sendStarInfo: starInfo not set.");

    this.logger.trace("_sendStarInfo: Sending StarInfo packet");
    await this.channel.send(getStarInfoMsg(this._starInfo));
  };

  _handleRequestStarInfo = async (timestamp) => {
    if (!this._starInfo) {
      this.logger.trace(
        "_handleRequestStarInfo: Received starInfo request but we don't have it.",
      );
      return;
    }

    const diffTimeMs = Math.abs(new Date() - timestamp);
    if (diffTimeMs > 5000) {
      this.logger.trace(
        "_handleRequestStarInfo: Received starInfo request but it's too old: " +
          diffTimeMs,
      );
      return;
    }

    this.logger.trace(
      "_handleRequestStarInfo: Answering request for starInfo.",
    );
    await this._sendStarInfo();
  };

  _handleStarInfo = (signer, packet) => {
    if (this._starInfo) {
      this.logger.trace(
        "_handleStarInfo: Received starInfo but we already have it.",
      );
      return;
    }

    const candidateStarInfo = new StarInfo(
      this.core,
      (type = packet.starInfo.type),
      (owners = packet.starInfo.owners),
      (creationUtc = packet.starInfo.creationUtc),
    );

    // star info id must match id that was used to open the channel.
    if (this.starId != candidateStarInfo.starId) {
      this.logger.trace(
        "_handleStarInfo: candidate rejected: starId did not match.",
      );
      return;
    }

    // star info must be signed by owner if owners is not empty.
    if (candidateStarInfo.owners && candidateStarInfo.owners.length > 0) {
      if (!candidateStarInfo.owners.includes(signer)) {
        this.logger.trace(
          "_handleStarInfo: candidate rejected: not signed by owner.",
        );
        return;
      }
    }

    this.logger.trace("_handleStarInfo: candidate accepted.");
    this._starInfo = candidateStarInfo;
  };

  _handleNewCodexCid = async (signer, packet) => {
    if (!this._starInfo) {
      this.logger.trace("_handleNewCodexCid: discarded, no starInfo.");
      return;
    }

    if (
      this._starInfo.owners.length > 0 &&
      !this._starInfo.owners.includes(signer)
    ) {
      this.logger.trace(
        "_handleNewCodexCid: discarded, not signed by owner. (todo consider admins/mods later!)",
      );
      return;
    }

    this.logger.trace("_handleNewCodexCid: received new CID.");
    await this.handler.onNewCid(packet.cdxCid);
  };

  _parsePacket = (msg) => {
    try {
      const packet = JSON.parse(msg);
      if (packet) return packet;
    } catch {}
    this.logger.trace(`Unparsable packet received: '${msg}'`);
  };
}
