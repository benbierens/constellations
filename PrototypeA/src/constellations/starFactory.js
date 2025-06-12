import { Star } from "./star.js";
import { StarInfo } from "./starInfo.js";
import { StarProperties, StarStatus } from "./starProperties.js";

function createDefaultNewStarProperties(core) {
  var result = new StarProperties(core);
  result._status = StarStatus.Bright;
  result._annotations = "new_star";
  return result;
}

export class StarFactory {
  constructor(core) {
    this._core = core;
    this._logger = core.logger.prefix("StarFactory");
  }

  createNewStar = async (
    type,
    owners,
    handler,
    autoFetch = false,
    creationUtc = new Date(),
    properties = createDefaultNewStarProperties(this._core),
  ) => {
    this._logger.trace(`createNewStar: type: '${type}'`);
    const star = new Star(this._core, handler, properties);
    star._starInfo = new StarInfo(this._core, type, owners, creationUtc);
    star.autoFetch = autoFetch;
    star._channel = await this._core.starChannelFactory.openById(
      star.starInfo.starId,
      star,
    );

    if (!star.isInitialized())
      this._logger.assert(
        "createNewStar: New star did not initialize correctly.",
      );
    return star;
  };

  connectToStar = async (starId, handler, autoFetch = false) => {
    this._logger.trace(`connectToStar: starId: '${starId}'`);
    const properties = new StarProperties(this._core);
    const star = new Star(this._core, null, handler, properties);
    if (star.isInitialized()) this._logger.assert("connectToStar: Star should be uninitialized at this moment.");
    star.autoFetch = autoFetch;
    star._channel = await this._core.starChannelFactory.openById(starId, star);

    // Now that the channel is open, the star starts processing historic messages.
    // These are likely to contain both starInfo and properties.
    // So we wait a moment to receive and process those.
    if (await this.waitForInitialized(star)) return star;

    // If we didn't receive them, we ask for them.
    if (!star.isStarInfoInitialized()) {
      await star._channel.sendRequestStarInfo();
    }
    if (!star.arePropertiesInitialized()) {
      await star._channel.sendRequestStarProperties();
    }

    // If we didn't receive them still, we're unable to connect.
    if (!(await this.waitForInitialized(star))) {
      await star._channel.close();
      this._logger.errorAndThrow(
        `connectToStar: Unable to connect. Failed to initialize star. Required data not received. starId: '${starId}'`,
      );
    }
    return star;
  };

  waitForInitialized = async (star) => {
    var count = 0;
    while (!star.isInitialized()) {
      await this._core.sleep(100);
      count++;
      if (count > 30) return false;
    }
    return true;
  };
}
