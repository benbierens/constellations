import { Star } from "./star.js";
import { StarInfo } from "./starInfo.js";

export class StarFactory {
  constructor(core) {
    this.core = core;
    this.logger = core.logger.prefix("StarFactory");
  }

  createNewStar = async (
    type,
    owners,
    handler,
    autoFetch = false,
    creationUtc = new Date(),
  ) => {
    this.logger.trace(`createNewStar: type: '${type}'`);
    const starInfo = new StarInfo(this.core, type, owners, creationUtc);
    const star = new Star(this.core, starInfo, handler);
    star.autoFetch = autoFetch;
    star.channel = await this.core.starChannelFactory.openByInfo(
      starInfo,
      star,
    );
    return star;
  };

  connectToStar = async (starId, handler, autoFetch = false) => {
    this.logger.trace(`connectToStar: starId: '${starId}'`);
    const star = new Star(this.core, null, handler);
    star.autoFetch = autoFetch;
    star.channel = await this.core.starChannelFactory.openById(starId, star);
    star.starInfo = await channel.getStarInfo();
    return star;
  };
}
