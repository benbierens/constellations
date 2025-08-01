import AsyncLock from "async-lock";

export class Lock {
  constructor(name) {
    this._name = name;
    this._lock = new AsyncLock();
  }

  lock = async (task) => {
    await this._lock.acquire(this._name, async (done) => {
      await task();
      done();
    });
  };
}
