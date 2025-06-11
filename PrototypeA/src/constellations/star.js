export class Star {
  constructor(core, starInfo, handler) {
    this.core = core;
    this.logger = core.logger.prefix("Star");
    this.starInfo = starInfo;
    this.handler = handler;

    this.autoFetch = false;

    this._cid = null;
  }

  disconnect = async () => {
    this.logger.trace("disconnect: Disconnecting...");
    await this.channel.close();

    // Clean up everything, prevent accidental use.
    this.core = null;
    this.logger = null;
    this.starInfo = null;
    this.handler = null;
    this._cid = null;
  };

  setData = async (data) => {
    if (!this._canModify()) {
      this.logger.trace("setData: cannot modify this star.");
      return;
    }

    const cid = await this.core.codexService.upload(data);
    await this.channel.setNewCid(cid);
  };

  getData = async () => {
    if (!this._cid) this.logger.errorAndThrow("getData: No CID known for star");
    return await this.core.codexService.downloadData(this._cid);
  };

  onNewCid = async (cid) => {
    this.logger.trace(`onNewCid: Received '${cid}'`);
    this._cid = cid;

    if (this.autoFetch) {
      await this.core.codexService.fetchData(cid);
    }
    await this.handler.onDataChanged(); // todo, this needs some really good args.
  };

  _canModify = () => {
    const nodeId = this.core.constellationNode.address;
    return this.starInfo.canModify(nodeId); // TODO: consider star property admins/mods.
  };
}
