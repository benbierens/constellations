export class Timer {
  constructor(core, name, callback, interval) {
    this._core = core;
    this._logger = core.logger.prefix("Timer:" + name);
    this._callback = callback;
    this._interval = interval;

    this._isRunning = false;
    this._worker = null;
  }

  start = () => {
    if (this._isRunning) this._logger.errorAndThrow("start: Already started");
    this._isRunning = true;
    this._worker = this._timerWorker();
  }

  stop = async () => {
    if (!this._isRunning) this._logger.errorAndThrow("stop: Not started");
    this._logger.trace("stop: Stopping...");
    this._isRunning = false;
    await this._worker;
    this._worker = null;
    this._logger.trace("stop: Stopped.");
  }

  _timerWorker = async () => {
    while (this._isRunning) {
      await this._core.sleep(this._interval);
      await this._callback();
    }
  }
}

export class TimerService {
  constructor(core) {
    this._core = core;
    this._logger = core.logger.prefix("TimerService");
  }

  createAndStart = (name, callback, interval) => {
    const timer = new Timer(this._core, name, callback, interval);
    this._logger.trace(`Starting new timer: '${name}'`);
    timer.start();
    return timer;
  }
}
