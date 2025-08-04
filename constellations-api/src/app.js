import { ConstellationFactory } from "./constellations/constellationFactory.js";
import { LogsCache } from "./logsCache.js";
import { Supporter } from "./supporter.js";

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

    this._supporter = new Supporter(this._factory._logger, this, this._config);
  }

  init = async () => {
    if (this._config.useMocks) {
      await this._factory.initializeWithMocks();
    }
    else {
      await this._factory.initializeWithBootstrapRecords(this._config.wakuBootstrapNodes);
    }

    await this._supporter.initialize();
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
    const handler = new ConstellationHandler(this._websocket, this._supporter, newId);
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
    const handler = new ConstellationHandler(this._websocket, this._supporter, newId);
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

  beginSupport = async (id) => {
    await this._supporter.addSupport(id);
  }

  isSupporting = (id) => {
    return this._supporter.isSupporting(id);
  }

  endSupport = async (id) => {
    await this._supporter.removeSupport(id);
  }
}

class ConstellationHandler {
  constructor(websocket, supporter, id) {
    this._websocket = websocket;
    this._supporter = supporter;
    this._id = id;
  }

  onPathsUpdated = async (starId) => {
    this._websocket.sendPathsChanged(this._id, starId);
    await this._supporter.onPathsUpdated();
  };

  onPropertiesChanged = async (starId) => {
    this._websocket.sendPropertiesChanged(this._id, starId);
  };

  onDataChanged = async (starId) => {
    this._websocket.sendDataChanged(this._id, starId);
  };
}
