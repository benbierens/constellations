import { ConstellationFactory } from "lib-constellations";
import { LogsCache } from "./logsCache.js";

var newId = 1;

export class App {
  constructor() {
    this._logsCache = new LogsCache();
    this._constellations = {};

    // todo make configurable
    this._wakuBootstrapNodes = [];
    this._codexAddress = "";
    this._privateKey = "";

    this._factory = new ConstellationFactory(
      this._logsCache,
      this._privateKey,
      this._codexAddress,
    );
  }

  init = async () => {
    await this._factory.initializeWithBootstrapRecords(
      this._wakuBootstrapNodes,
    );
  };

  getLogs = () => {
    return this._logsCache.getLogs();
  };

  get address() {
    return this._factory.walletAddress;
  }

  getConstellationIds = () => {
    return Object.keys(this._constellations);
  };

  createNew = async (owners) => {
    newId++;
    const handler = new ConstellationHandler(newId);
    const constellation = await this._factory.createNewConstellation(
      owners,
      handler,
    );
    this._constellations[newId] = {
      id: newId,
      constellation: constellation,
      handler: handler,
    };
    return newId;
  };

  connectNew = async (constellationId) => {
    const keys = Object.keys(this._constellations)
    for (const key of keys) {
      const entry = this._constellations[key];
      if (entry.constellation.id == constellationId) {
        return entry.id;
      }
    }

    newId++;
    const handler = new ConstellationHandler(newId);
    const constellation =
      await this._factory.connectToConstellation(constellationId);
    this._constellations[newId] = {
      id: newId,
      constellation: constellation,
      handler: handler,
    };
    return newId;
  };

  disconnect = async (id) => {
    const entry = this._constellations[id];
    if (!entry) return;
    await entry.constellation.disconnect();
    delete this._constellations[id];
  };
}

class ConstellationHandler {
  constructor(id) {
    this._id = id;
  }

  onPathsUpdated = async (starId) => {};
  onPropertiesChanged = async (starId) => {};
  onDataChanged = async (starId) => {};
}
