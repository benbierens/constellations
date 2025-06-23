export class StarFactory {
  constructor(core) {
    this._core = core;
    this._logger = core.logger.prefix("ConstellationFactory");
  }

  createNewConstellation = async () => {
    throw new Error("entirely todo")
  };

  connectToConstellation = async (constellationId, handler) => {
    // connect to star
    // if not constellation, throw
    // get data, initialize with it, raise update event
  };
}
