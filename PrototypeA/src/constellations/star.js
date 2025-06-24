import { getAnnotationsUninitializedValue } from "./protocol.js";
import { StarConfiguration } from "./starConfiguration.js";
import { StarProperties, StarStatus } from "./starProperties.js";

export class Star {
  constructor(core, starInternal, handler, cidTracker) {
    this._core = core;
    this._logger = core.logger.prefix("Star");
    this._internal = starInternal;
    this._handler = handler;
    this._cidTracker = cidTracker;

    this._starInfo = null;
    this._starProperties = null;
  }

  disconnect = async () => {
    this._logger.trace("disconnect: Disconnecting...");

    await this._internal.disconnect();

    // Clean up everything, prevent accidental use.
    const logger = this._logger;
    this._core = null;
    this._logger = null;
    this._internal = null;
    this._handler = null;
    this._starInfo = null;
    this._starProperties = null;

    logger.trace("disconnect: Disconnected");
  };

  get starId() {
    return this._internal.starId;
  }

  get health() {
    return this._internal.health;
  }

  get starInfo() {
    return this._starInfo;
  }

  get properties() {
    return this._properties;
  }

  get size() {
    return this._cidTracker.size;
  }

  get lastChangeUtc() {
    return this._cidTracker.utc;
  }

  setData = async (data) => {
    if (!this._canModifyData()) {
      this._logger.trace("setData: cannot modify this star.");
      return;
    }

    const cid = await this._core.codexService.upload(data);

    await this._internal.sendCdxCid(cid);

    await this._cidTracker.afterUpload(cid);
  };

  getData = async () => {
    return await this._cidTracker.doDownload();
  };

  setAutoFetch = (autoFetch) => {
    this._cidTracker.shouldFetch = autoFetch;
  };

  isInitialized = () => {
    return this.isStarInfoInitialized() && this.arePropertiesInitialized();
  };

  isStarInfoInitialized = () => {
    if (this.starInfo) return true;
    return false;
  };

  arePropertiesInitialized = () => {
    return (
      this.properties &&
      this.properties.status &&
      this.properties.annotations &&
      this.properties.status != StarStatus.Unknown &&
      this.properties.annotations != getAnnotationsUninitializedValue()
    );
  };

  onStarInfo = async (starInfo) => {
    this._starInfo = starInfo;
  };

  onStarProperties = async (starProperties) => {
    this._properties = new StarProperties(this._core);
    this._properties._status = starProperties.status;
    this._properties._configuration = new StarConfiguration(this._core);
    this._properties._configuration._maxDiffSize =
      starProperties.configuration.maxDiffSize;
    this._properties._configuration._softMinSnapshotDuration =
      starProperties.configuration.softMinSnapshotDuration;
    this._properties._configuration._softMaxDiffDuration =
      starProperties.configuration.softMaxDiffDuration;
    this._properties._configuration._softMaxNumDiffs =
      starProperties.configuration.softMaxNumDiffs;
    this._properties._configuration._channelMonitoringMinutes =
      starProperties.configuration.channelMonitoringMinutes;
    this._properties._configuration._cidMonitoringMinutes =
      starProperties.configuration.cidMonitoringMinutes;
    this._properties._admins = starProperties.admins;
    this._properties._mods = starProperties.mods;
    this._properties._annotations = starProperties.annotations;

    this._properties._canModifyProperties = this._canModifyProperties;
    this._properties._configuration._canModifyProperties =
      this._canModifyProperties;
    this._properties._changeHandler = this._handleStarPropertiesChanged;

    await this._handler.onPropertiesChanged(this);
  };

  onCdxCid = async (cdxCid) => {
    this._cdxCid = cdxCid;
    await this._handler.onDataChanged(this);
  };

  _canModifyProperties = (nodeId = this._core.constellationNode.address) => {
    const allowed = this._internal.getAllowedPropertyModifiers();
    return allowed.includes(nodeId);
  };

  _canModifyData = (nodeId = this._core.constellationNode.address) => {
    const allowed = this._internal.getAllowedDataModifiers();
    return allowed.includes(nodeId);
  };

  _handleStarPropertiesChanged = async (starProperties) => {
    await this._internal.sendStarProperties(starProperties);
  };
}
