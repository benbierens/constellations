export class HandlerDebouncer {
  // When connecting to a star, it's possible to receive a lot of historic
  // messages very quickly. In this case, the handler might become invoked
  // many times very quickly, providing old/outdated data to the handler.
  // To prevent this, debouncer caches the signals passed to the handler
  // until it is resolved by the factory.
  constructor(core, backingHandler) {
    this._core = core;
    this._handler = backingHandler;

    this._resolved = false;
    // For each signal, cache the latest values.
    this._data_star = null;
    this._properties_star = null;
  }

  resolve = async () => {
    await this._core.sleep(100);
    this._resolved = true;

    if (this._data_star) {
      await this._handler.onDataChanged(this._data_star);
      this._data_star = null;
    }
    if (this._properties_star) {
      await this._handler.onPropertiesChanged(this._properties_star);
      this._properties_star = null;
    }
  };

  onDataChanged = async (star) => {
    if (this._resolved) {
      await this._handler.onDataChanged(star);
    } else {
      this._data_star = star;
    }
  };

  onPropertiesChanged = async (star) => {
    if (this._resolved) {
      await this._handler.onPropertiesChanged(star);
    } else {
      this._properties_star = star;
    }
  };
}
