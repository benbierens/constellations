const codexDataTimeout = 1000 * 60 * 60 * 8;
const trackerInterval = 1000 * 60 * 60;

export class CidTracker {
  constructor(core) {
    this._core = core;
    this._logger = core.logger.prefix("CidTracker");

    this.shouldFetch = false;

    this._cid = null;
    this._lastFetch = null;
    this._have = false;
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

  get have() {
    return this._have;
  }

  onNewCid = async (newCid) => {
    if (this._cid == newCid) return;

    this._cid = newCid;
    this._lastFetch = null;

    if (this.shouldFetch) {
      await this.doFetch();
    }
  };

  doFetch = async () => {
    if (!this._cid) {
      this._logger.warn("doFetch: No CID known for star.");
      return;
    }

    try {
      await this._core.codexService.fetchData(this._cid);

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

      this._lastFetch = new Date();
      this._have = true;
      todo when _have goes from false to true, trigger healtmonitor cid metric.trySendNow
      this._logger.trace("doFetch: Successful");
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
      this._lastFetch = new Date();
      this._have = true;
      todo when _have goes from false to true, trigger healtmonitor cid metric.trySendNow
      this._logger.trace("doDownload: Successful");
      return data;
    } catch (error) {
      this._logger.errorAndThrow("Failed to download CID: " + error);
    }
  };

  _onTimer = async () => {
    if (this.shouldFetch) {
      await this.doFetch();
    }

    const now = new Date();
    this._have = now - this._lastFetch < codexDataTimeout;
  };
}
