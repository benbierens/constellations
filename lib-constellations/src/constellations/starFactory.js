import { CidTracker } from "./cidTracker.js";
import { HandlerDebouncer } from "./handlerDebouncer.js";
import { Star } from "./star.js";
import { createDefaultNewStarConfiguration } from "./starConfiguration.js";
import { StarInternal } from "./starInternal.js";
import { StarStatus } from "./starProperties.js";

function createDefaultNewStarProperties() {
  return {
    admins: [],
    mods: [],
    status: StarStatus.Bright,
    configuration: createDefaultNewStarConfiguration(),
    annotations: "new_star",
  };
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
    creationUtc = new Date(),
    properties = createDefaultNewStarProperties(),
  ) => {
    if (!type)
      // todo: validate user string input at api level: !isValidUserStringValue(type)
      this._logger.errorAndThrow("createNewStar: type invalid.");
    if (!owners) owners = []; // todo: change requirement: always 1 or more owners?
    if (!creationUtc)
      this._logger.errorAndThrow("createNewStar: creationUtc invalid.");
    if (!handler) this._logger.errorAndThrow("createNewStar: handler invalid.");
    if (!properties)
      this._logger.errorAndThrow("createNewStar: properties invalid.");
    this._logger.trace(`createNewStar: type: '${type}'`);

    const starInfo = {
      type: type,
      owners: owners,
      creationUtc: creationUtc,
    };
    const starId = this._core.generateStarId(starInfo);
    this._logger.trace(`createNewStar: new starId: '${starId}'`);

    const channel = await this._core.starChannelFactory.createById(starId);
    const cidTracker = new CidTracker(this._core);
    const internal = new StarInternal(this._core, starId, channel, cidTracker);
    const star = new Star(this._core, internal, handler, cidTracker);
    internal.init(star);

    await channel.open(internal);

    await internal.sendStarInfo(starInfo);
    await internal.sendStarProperties(properties);

    if (!(await this._waitForInitialized(star))) {
      await channel.close();
      this._logger.assert(
        "createNewStar: New star did not initialize correctly.",
      );
    }
    this._logger.trace(`createNewStar: Success. starId: '${star.starId}'`);
    if (!star.isInitialized()) {
      await channel.close();
      this._logger.assert("createNewStar: Failed to initialize.");
    }
    return star;
  };

  connectToStar = async (starId, handler) => {
    if (!starId) this._logger.errorAndThrow("connectToStar: starId invalid.");
    if (!handler) this._logger.errorAndThrow("connectToStar: handler invalid.");

    this._logger.trace(`connectToStar: Connecting... starId: '${starId}'`);
    const channel = await this._core.starChannelFactory.createById(starId);
    const cidTracker = new CidTracker(this._core);
    const internal = new StarInternal(this._core, starId, channel, cidTracker);
    const debouncer = new HandlerDebouncer(this._core, handler);
    const star = new Star(this._core, internal, debouncer, cidTracker);
    internal.init(star);

    await channel.open(internal);

    // Now that the channel is open, the star starts processing historic messages.
    // These are likely to contain both starInfo and properties.
    // So we wait a moment to receive and process those.
    if (await this._waitForInitialized(star)) {
      await debouncer.resolve();
      if (!star.isInitialized()) {
        await channel.close();
        this._logger.assert("connectToStar: Fail on fast-initialize.");
      }
      this._logger.trace(
        `connectToStar: Fast-Success. starId: '${star.starId}'`,
      );
      return star;
    }

    this._logger.trace(
      "connectToStar: Didn't receive initialization data. Requesting it...",
    );
    // If we didn't receive them, we ask for them.
    if (!star.isStarInfoInitialized()) {
      await internal._starInfo.sendRequest();
    }
    if (!star.arePropertiesInitialized()) {
      await internal._starProperties.sendRequest();
    }

    // If we didn't receive them still, we're unable to connect.
    if (!(await this._waitForInitialized(star))) {
      await channel.close();
      this._logger.errorAndThrow(
        `connectToStar: Unable to connect. Failed to initialize star. Required data not received. starId: '${starId}'`,
      );
    }

    await debouncer.resolve();
    if (!star.isInitialized()) {
      await channel.close();
      this._logger.assert("connectToStar: Fail on slow-initialize.");
    }
    this._logger.trace(`connectToStar: Slow-Success. starId: '${star.starId}'`);
    return star;
  };

  _waitForInitialized = async (star) => {
    return await this._waitFor(() => star.isInitialized());
  };

  _waitFor = async (condition) => {
    var count = 0;
    while (!condition()) {
      await this._core.sleep(20);
      count++;
      if (count > 200) return false;
    }
    return true;
  };
}
