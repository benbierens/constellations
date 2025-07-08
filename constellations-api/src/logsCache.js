export class LogsCache {
  constructor() {
    this._cache = [];
  }

  std = (msg) => {
    console.log(msg);
    this._cache.push(msg);
    while (this._cache.length > 1000) this._cache.shift();
  };

  err = (msg) => {
    this.std(msg);
  };

  getLogs = () => {
    const result = this._cache;
    this._cache = [];
    return result;
  };
}
