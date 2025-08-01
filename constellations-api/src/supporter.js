import AsyncLock from "async-lock";

export class Supporter {
  constructor(logger, app, config) {
    this._logger = logger.prefix("Supporter");
    this._app = app;
    this._config = config;

    this._localIds = [];
    this._workerLock = new AsyncLock();
    this._worker = null;
  }

  initialize = async () => {
    this._logger.trace(`Initializing for ${this._config.supportConstellations.length} configured constellations...`);
    for (const constellationId of this._config.supportConstellations) {
      await this._addByConstellationId(constellationId);
    }
    await this._startWorker();
  }

  addSupport = async (id) => {
    const ids = this._app.getConstellationIds();
    if (!ids.includes(id)) {
      this._logger.warn(`Attempt to enable support for '${id}', but id is not in use.`);
      return;
    }

    this._localIds.push(id);
    await this._startWorker();
    this._logger.trace(`Support started for '${id}'`);
  }

  removeSupport = async (id) => {
    if (!this._localIds.includes(id)) return;

    this._logger.trace(`Discontinuing support for '${id}'...`);

    const idx = this._localIds.indexOf(id);
    this._localIds.splice(idx, 1);
    await this._app.disconnect(id);
  }

  onPathsUpdated = async () => {
    await this._startWorker();
  }

  _addByConstellationId = async (constellationId) => {
    try {
      this._logger.trace(`Attempting to connect to '${constellationId}'...`);
      const newId = await this._app.connectNew(constellationId);
      this._localIds.push(newId);
      this._logger.trace(`Connect to '${constellationId}' successful. Support started.`);
    }
    catch (error) {
      this._logger.error(`Failed to connect to '${constellationId}': ${error}`);
    }
  }

  _startWorker = async () => {
    await this._workerLock.acquire("SupportWorkerLock", async (done) => {
      if (this._worker) return;
      this._worker = this._run();
      done();
    });
  }

  _run = async () => {
    this._logger.trace("Worker started...");

    try {
      await this._workerLoop();
    }
    catch (error) {
      this._logger.error(`Error in worker loop: ${error}`);
    }

    await this._workerLock.acquire("SupportWorkerLock", async (done) => {
      this._logger.trace("Worker finished");
      this._worker = null;
      done();
    });
  }

  _workerLoop = async () => {
    
  }
}
