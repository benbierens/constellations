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
  };

  stop = async () => {
    if (!this._isRunning) this._logger.errorAndThrow("stop: Not started");
    this._logger.trace("stop: Stopping...");
    this._isRunning = false;
    // await this._worker;? This will block the stop function for the remaining sleep time.
    this._worker = null;
    this._logger.trace("stop: Stopped.");
  };

  _timerWorker = async () => {
    while (this._isRunning) {
      await this._core.sleep(this._interval);
      try {
        if (this._isRunning) {
          await this._callback();
        }
      } catch (error) {
        this._logger.error(
          "_timerWorker: Timer stopped. Error during callback: " + error,
        );
        return;
      }
    }
  };
}

export class TimerService {
  constructor(core) {
    this._core = core;
    this._logger = core.logger.prefix("TimerService");
  }

  createAndStart = (name, callback, interval) => {
    const timer = new Timer(this._core, name, callback, interval);
    this._logger.trace(
      `Starting new timer: '${name}' with interval '${interval}'`,
    );
    timer.start();
    return timer;
  };

  monitorDuration = async(name, maxDurationMs, callback) => {
    var isResolved = false;

    const promise = callback().then(function() {
      isResolved = true;
    });
    const timeout = this._core.sleep(maxDurationMs);

    await Promise.race([promise, timeout]);
    
    if (isResolved) return;
    throw new Error("Timeout exceeded for " + name);
  }
}
