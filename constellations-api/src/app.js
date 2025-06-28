import { ConstellationFactory } from "lib-constellations";
import { LogsCache } from "./logsCache.js";

var newId = 1;

export class App {
  constructor(config, websocket) {
    this._config = config;
    this._websocket = websocket;
    this._logsCache = new LogsCache();
    this._constellations = {};

    this._factory = new ConstellationFactory(
      this._logsCache,
      this._config.privateKey,
      this._config.codexAddress,
    );
  }

  init = async () => {
    await this._factory.initializeWithBootstrapRecords(
      this._config.wakuBootstrapNodes,
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
    const handler = new ConstellationHandler(this._websocket, newId);
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
    const keys = Object.keys(this._constellations);
    for (const key of keys) {
      const entry = this._constellations[key];
      if (entry.constellation.id == constellationId) {
        return entry.id;
      }
    }

    newId++;
    const handler = new ConstellationHandler(this._websocket, newId);
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
  constructor(websocket, id) {
    this._websocket = websocket;
    this._id = id;
  }

  onPathsUpdated = async (starId) => {
    this._websocket.sendPathsChanged(this._id, starId);
  };

  onPropertiesChanged = async (starId) => {
    this._websocket.sendPropertiesChanged(this._id, starId);
  };

  onDataChanged = async (starId) => {
    this._websocket.sendDataChanged(this._id, starId);
  };
}
