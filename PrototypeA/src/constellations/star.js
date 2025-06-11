export class Star {
  constructor(core, starInfo, starChannel) {
    this.core = core;
    this.logger = core.logger.prefix("Star");
    this.starInfo = starInfo;
    this.starChannel = starChannel;
  }

  setData = async (data) => {
    if (!this._canModify()) {
      this.logger.trace("setData: cannot modify this star.");
      return;
    }

    const cid = await this.core.codexService.upload(data);
    await this.starChannel.setNewCid(cid);
  };

  _canModify = () => {
    if (this.starInfo.owners.length < 1) return true;
    return this.starInfo.owners.includes(this.core.constellationNode.address);
  };
}
