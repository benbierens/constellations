const codexDataTimeout = 1000 * 60 * 60 * 8;
const trackerInterval = 1000 * 60 * 60;

export class CidTracker {
  constructor(core) {
    this._core = core;
    this._logger = core.logger.prefix("CidTracker");

    this._shouldFetch = false;

    this._cid = null;
    this._utc = new Date(0);
    this._lastFetch = null;
    this._have = false;
    this._size = 0;
  }

  start = () => {
    this._timer = this._core.timerService.createAndStart(
      "CidTracker",
      this._onTimer,
      trackerInterval,
    );
  };

  stop = async () => {
    await this._timer.stop();
  };

  get cid() {
    return this._cid;
  }

  get utc() {
    return this._utc;
  }

  get have() {
    return this._have;
  }

  get size() {
    return this._size;
  }

  get shouldFetch() {
    return this._shouldFetch;
  }

  setShouldFetch = async (f) => {
    if (!this._shouldFetch && f) {
      await this.doFetch();
    }
    this._shouldFetch = f;
  };

  onNewCid = async (newCid, utc) => {
    if (this._cid == newCid) return;

    this._logger.trace("onNewCid: cleared");
    this._cid = newCid;
    this._utc = utc;
    this._lastFetch = null;
    this._have = false;

    if (this._shouldFetch) {
      await this.doFetch();
    } else {
      await this._updateSize();
    }
  };

  doFetch = async () => {
    if (!this._cid) {
      this._logger.warn("doFetch: No CID known for star.");
      return;
    }

    try {
      const manifest = await this._core.codexService.fetchData(this._cid);
      this._size = manifest.datasetSize;

      // BIG TODO:
      // There's currently no way to use the CODEX api to figure out
      // when the fetch completes, or if it was successful
      // there's no way to know in case the dataset was already present, what
      // the expiry UTC of the dataset is, and there's no way to modify/update the expiry.
      // So, we might just fetch a CID right now, and in 5 minutes it expires and is gone.
      // we can't know and we can't prevent it.

      // So for now, we just assume that after calling 'fetch', we have the data for the
      // next <codexDataTimeout> duration.
      // Which is probably but not necessarily true.

      this._logger.trace("doFetch: Successful");
      await this._nowHave();
    } catch (error) {
      this._logger.errorAndThrow("Failed to fetch CID: " + error);
    }
  };

  doDownload = async () => {
    if (!this._cid) {
      this._logger.errorAndThrow("doDownload: No CID known for star.");
    }

    // Same idea as doFetch except actually return the data.
    // Same TODO w.r.t. expiry applies.
    try {
      const data = await this._core.codexService.downloadData(this._cid);
      this._logger.trace("doDownload: Successful");
      await this._nowHave();
      return data;
    } catch (error) {
      this._logger.errorAndThrow("Failed to download CID: " + error);
    }
  };

  afterUpload = async (cid) => {
    // We've just uploaded a new CID and sent the update message to the channel.
    // We obviously have the data and should follow up with the health monitor.
    this._cid = cid;
    this._utc = new Date();
    this._have = false;
    await this._nowHave();
  };

  setHealthMonitor = (monitor) => {
    this._monitor = monitor;
  };

  _onTimer = async () => {
    if (this._shouldFetch) {
      await this.doFetch();
    }

    const now = new Date();
    this._have = now - this._lastFetch < codexDataTimeout;
  };

  _nowHave = async () => {
    this._lastFetch = new Date();

    if (this._have) return;
    this._logger.trace("_nowHave: set");
    this._have = true;
    await this._updateSize();

    // We let the monitor know that we now are now storing the CID.
    if (!this._monitor) {
      this._logger.warn("_nowHave: No monitor is set");
    } else {
      await this._monitor.trySendCidNow();
    }
  };

  _updateSize = async () => {
    try {
      const manifest = await this._core.codexService.getManifest(this._cid);
      this._size = manifest.datasetSize;
    } catch (error) {
      this._logger.errorAndThrow("Failed to fetch manifest for CID: " + error);
    }
  };
}
