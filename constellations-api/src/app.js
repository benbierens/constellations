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
    await this._factory.initializeWithMocks();
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

  getRoot = (id) => {
    const entry = this._constellations[id];
    if (!entry) return;
    return entry.constellation.root;
  };

  activate = async (id, path) => {
    const entry = this._constellations[id];
    if (!entry) return;
    await entry.constellation.activate(path);
  };

  deactivate = async (id, path) => {
    const entry = this._constellations[id];
    if (!entry) return;
    await entry.constellation.deactivate(path);
  };

  getInfo = (id, path) => {
    const entry = this._constellations[id];
    if (!entry) return;
    return entry.constellation.info(path);
  };

  updateProperties = async (id, path, properties) => {
    const entry = this._constellations[id];
    if (!entry) return;
    await entry.constellation.updateProperties(path, properties);
  };

  disconnect = async (id) => {
    const entry = this._constellations[id];
    if (!entry) return;
    await entry.constellation.disconnect();
    delete this._constellations[id];
  };

  getData = async (id, path) => {
    const entry = this._constellations[id];
    if (!entry) return;
    return await entry.constellation.getData(path);
  };

  setData = async (id, path, newData) => {
    const entry = this._constellations[id];
    if (!entry) return;
    await entry.constellation.setData(path, newData);
  };

  fetch = async (id, path) => {
    const entry = this._constellations[id];
    if (!entry) return;
    await entry.constellation.fetch(path);
  };

  setAutoFetch = async (id, path, autoFetch) => {
    const entry = this._constellations[id];
    if (!entry) return;
    await entry.constellation.setAutoFetch(path, autoFetch);
  };

  createNewFile = async (id, path, type, owners) => {
    const entry = this._constellations[id];
    if (!entry) return;
    return await entry.constellation.createNewFile(path, type, owners);
  };

  createNewFolder = async (id, path, owners) => {
    const entry = this._constellations[id];
    if (!entry) return;
    return await entry.constellation.createNewFolder(path, owners);
  };

  delete = async (id, path, updateStarStatus) => {
    const entry = this._constellations[id];
    if (!entry) return;
    await entry.constellation.delete(path, updateStarStatus);
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
