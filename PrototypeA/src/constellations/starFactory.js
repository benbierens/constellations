import { isValidUserStringValue } from "./protocol.js";
import { Star } from "./star.js";
import { StarInternal } from "./starInternal.js";
import { StarProperties, StarStatus } from "./starProperties.js";

function createDefaultNewStarProperties(core) {
  var result = new StarProperties(core);
  result._status = StarStatus.Bright;
  result._annotations = "new_star";
  result._utc = new Date();
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
    if (!type || !isValidUserStringValue(type)) this._logger.errorAndThrow("createNewStar: type invalid.");
    if (!owners) owners = []; // todo: change requirement: always 1 or more owners?
    if (!creationUtc) this._logger.errorAndThrow("createNewStar: creationUtc invalid.");
    if (!handler) this._logger.errorAndThrow("createNewStar: handler invalid.");
    if (!properties) this._logger.errorAndThrow("createNewStar: properties invalid.");
    this._logger.trace(`createNewStar: type: '${type}'`);

    const starInfo = {
      type: type,
      owners: owners,
      creationUtc: creationUtc
    };
    const starId = this._core.generateStarId(starInfo);
    const channel = await this._core.starChannelFactory.createById(starId);

    const internal = new StarInternal(this._core, starId, channel);
    const star = new Star(this._core, internal, handler);
    internal.init(star);

    star.autoFetch = autoFetch;

    await channel.open(internal);

    await internal.sendStarInfo(starInfo);
    await internal.sendStarProperties(properties);
    
    if (!await this._waitForInitialized(star))
      this._logger.assert(
        "createNewStar: New star did not initialize correctly.",
      );
    this._logger.trace(`createNewStar: Success. starId: '${star.starInfo.starId}'`);
    return star;
  };

  connectToStar = async (starId, handler, autoFetch = false) => {
    if (!starId) this._logger.errorAndThrow("connectToStar: starId invalid.");
    if (!handler) this._logger.errorAndThrow("connectToStar: handler invalid.");

    this._logger.trace(`connectToStar: Connecting... starId: '${starId}'`);
    const channel = await this._core.starChannelFactory.createById(starId);

    const internal = new StarInternal(this._core, starId, channel);
    const star = new Star(this._core, internal, handler);
    internal.init(star);

    star.autoFetch = autoFetch;
    await channel.open(internal);

    // Now that the channel is open, the star starts processing historic messages.
    // These are likely to contain both starInfo and properties.
    // So we wait a moment to receive and process those.
    if (await this._waitForInitialized(star)) {
      this._logger.trace(`connectToStar: Fast-Success. starId: '${star.starInfo.starId}'`);
      return star;
    }
    
    // If we didn't receive them, we ask for them.
    if (!star.isStarInfoInitialized()) {
      await internal._starInfo.sendRequest();
    }
    if (!star.arePropertiesInitialized()) {
      await internal._starProperties.sendRequest();
    }

    // If we didn't receive them still, we're unable to connect.
    if (!(await this._waitForInitialized(star))) {
      await star._channel.close();
      this._logger.errorAndThrow(
        `connectToStar: Unable to connect. Failed to initialize star. Required data not received. starId: '${starId}'`,
      );
    }
    
    this._logger.trace(`connectToStar: Slow-Success. starId: '${star.starInfo.starId}'`);
    return star;
  };

  _waitForInitialized = async (star) => {
    return await this._waitFor(async () => star.isInitialized());
  };

  _waitFor = async (condition) => {
    var count = 0;
    while (!condition()) {
      await this._core.sleep(100);
      count++;
      if (count > 30) return false;
    }
    return true;
  }
}
