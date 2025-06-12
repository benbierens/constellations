import { Star } from "./star.js";
import { StarInfo } from "./starInfo.js";
import { StarProperties, StarStatus } from "./starProperties.js";

function createDefaultProperties(core) {
  var result = new StarProperties(core);
  result.status = StarStatus.Bright;
  return result;
}

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
    properties = createDefaultProperties(this.core)
  ) => {
    this.logger.trace(`createNewStar: type: '${type}'`);
    const starInfo = new StarInfo(this.core, type, owners, creationUtc);
    const star = new Star(this.core, starInfo, handler, properties);
    star.autoFetch = autoFetch;
    star._channel = await this.core.starChannelFactory.openByInfo(
      starInfo,
      star,
    );
    return star;
  };

  connectToStar = async (starId, handler, autoFetch = false) => {
    this.logger.trace(`connectToStar: starId: '${starId}'`);
    const star = new Star(this.core, null, handler, null);
    star.autoFetch = autoFetch;
    star._channel = await this.core.starChannelFactory.openById(starId, star);
    star._starInfo = await star._channel.getStarInfo();
    star._properties = await star._channel.getStarProperties();
    return star;
  };
}
