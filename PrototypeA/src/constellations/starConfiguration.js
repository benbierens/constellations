export function createDefaultNewStarConfiguration() {
  return {
    // TODO: Diff-related parameters are 0. Diffs are entirely todo!

    // Size in bytes for how large a single diff can be. (determined by waku message size?)
    maxDiffSize: 0,

    // After a snapshot was made and published, diffs cannot cause a new snapshot
    // to be created for at least this length of time. A user action that modified a segment of data too large to be captured in a diff
    // can disregard this restriction.
    softMinSnapshotDuration: 0,

    // If we have a diff older than this, snapshot it if allowed by MinSnapshotDuration.
    softMaxDiffDuration: 0,

    // If we have more than this many diffs, snapshot if allowed by MinSnapshotDuration.
    softMaxNumDiffs: 0,

    // Every this, send a message to let others know you're monitoring this channel.
    channelMonitoringMinutes: 15,

    // Every this, send a message to let others know you're fetching and holding this cid.
    // Send a new one when the cid changes.
    cidMonitoringMinutes: 60,
  };
}

export class StarConfiguration {
  constructor(core) {
    this._core = core;
    this.logger = core.logger.prefix("StarConfiguration");

    this._maxDiffSize = 0;
    this._softMinSnapshotDuration = 0;
    this._softMaxDiffDuration = 0;
    this._softMaxNumDiffs = 0;

    this._channelMonitoringMinutes = 15;
    this._cidMonitoringMinutes = 60;

    this._hasChanged = false;
    this._canModifyProperties = () => {
      this.logger.assert("_canModifyProperties: callback not initialized.");
    };
  }

  get maxDiffSize() {
    return this._maxDiffSize;
  }

  set maxDiffSize(newValue) {
    if (!this._canModifyProperties()) {
      this.logger.trace("set maxDiffSize: Change not permitted.");
      return;
    }
    if (!newValue || newValue < 1)
      this.logger.errorAndThrow(
        `set maxDiffSize: Invalid value: '${newValue}'`,
      );
    if (this._maxDiffSize == newValue) return;
    this._maxDiffSize = newValue;
    this._hasChanged = true;
  }

  get softMinSnapshotDuration() {
    return this._softMinSnapshotDuration;
  }

  set softMinSnapshotDuration(newValue) {
    if (!this._canModifyProperties()) {
      this.logger.trace("set softMinSnapshotDuration: Change not permitted.");
      return;
    }
    if (!newValue || newValue < 1)
      this.logger.errorAndThrow(
        `set softMinSnapshotDuration: Invalid value: '${newValue}'`,
      );
    if (this._softMinSnapshotDuration == newValue) return;
    this._softMinSnapshotDuration = newValue;
    this._hasChanged = true;
  }

  get softMaxDiffDuration() {
    return this._softMaxDiffDuration;
  }

  set softMaxDiffDuration(newValue) {
    if (!this._canModifyProperties()) {
      this.logger.trace("set softMaxDiffDuration: Change not permitted.");
      return;
    }
    if (!newValue || newValue < 1)
      this.logger.errorAndThrow(
        `set softMaxDiffDuration: Invalid value: '${newValue}'`,
      );
    if (this._softMaxDiffDuration == newValue) return;
    this._softMaxDiffDuration = newValue;
    this._hasChanged = true;
  }

  get softMaxNumDiffs() {
    return this._softMaxNumDiffs;
  }

  set softMaxNumDiffs(newValue) {
    if (!this._canModifyProperties()) {
      this.logger.trace("set softMaxNumDiffs: Change not permitted.");
      return;
    }
    if (!newValue || newValue < 1)
      this.logger.errorAndThrow(
        `set softMaxNumDiffs: Invalid value: '${newValue}'`,
      );
    if (this._softMaxNumDiffs == newValue) return;
    this._softMaxNumDiffs = newValue;
    this._hasChanged = true;
  }

  get channelMonitoringMinutes() {
    return this._channelMonitoringMinutes;
  }

  set channelMonitoringMinutes(newValue) {
    if (!this._canModifyProperties()) {
      this.logger.trace("set channelMonitoringMinutes: Change not permitted.");
      return;
    }
    if (!newValue || newValue < 1)
      this.logger.errorAndThrow(
        `set channelMonitoringMinutes: Invalid value: '${newValue}'`,
      );
    if (this._channelMonitoringMinutes == newValue) return;
    this._channelMonitoringMinutes = newValue;
    this._hasChanged = true;
  }

  get cidMonitoringMinutes() {
    return this._cidMonitoringMinutes;
  }

  set cidMonitoringMinutes(newValue) {
    if (!this._canModifyProperties()) {
      this.logger.trace("set cidMonitoringMinutes: Change not permitted.");
      return;
    }
    if (!newValue || newValue < 1)
      this.logger.errorAndThrow(
        `set cidMonitoringMinutes: Invalid value: '${newValue}'`,
      );
    if (this._cidMonitoringMinutes == newValue) return;
    this._cidMonitoringMinutes = newValue;
    this._hasChanged = true;
  }
}

export function isDefaultConfiguration(config) {
  return (
    config.maxDiffSize == 0 &&
      config.softMinSnapshotDuration == 0 &&
      config.softMaxDiffDuration == 0 &&
      config.softMaxNumDiffs == 0 &&
      config.channelMonitoringMessageMinutes == 15,
    (config.cidMonitoringMessageMinutes = 60)
  );
}
