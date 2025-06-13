import { getAnnotationsUninitializedValue } from "./protocol.js";
import {
  StarStatus,
  deserializeStarProperties,
  serializeStarProperties,
} from "./starProperties.js";

export class Star {
  constructor(core, handler, properties) {
    this._core = core;
    this._logger = core.logger.prefix("Star");
    this._handler = handler;

    this.autoFetch = false;

    this._setProperties(properties);
    this._starInfo = null;
    this._cidUtc = null;
  }

  disconnect = async () => {
    this._logger.trace("disconnect: Disconnecting...");
    await this._channel.close();

    // Clean up everything, prevent accidental use.
    this.onRequestStarInfo = async () => {};
    this.onStarInfo = async (info) => {};
    this.onStarProperties = async (props) => {};
    this.onNewCid = async (signer, cid) => {};
    this._core = null;
    this._logger = null;
    this._handler = null;
    this._channel = null;
    this._starInfo = null;
    this._properties = null;
    this._cidUtc = null;
  };

  get starInfo() {
    return this._starInfo;
  }

  get properties() {
    return this._properties;
  }

  setData = async (data) => {
    if (!this._canModifyData()) {
      this._logger.trace("setData: cannot modify this star.");
      return;
    }

    const cid = await this._core.codexService.upload(data);
    await this._channel.sendNewCid(cid);
  };

  getData = async () => {
    if (!this._cidUtc)
      this._logger.errorAndThrow("getData: No CID known for star.");
    return await this._core.codexService.downloadData(this._cidUtc.cid);
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

  onRequestStarInfo = async () => {
    if (this.isStarInfoInitialized()) {
      this._logger.trace("onRequestStarInfo: Sending...");
      await this._channel.sendStarInfo(this.starInfo);
    }
  };

  onRequestStarProperties = async () => {
    if (this.arePropertiesInitialized()) {
      this._logger.trace("onRequestStarProperties: Sending...");
      const json = serializeStarProperties(this.properties);
      await this._channel.sendStarProperties(json);
    }
  };

  onStarInfo = async (candidateStarInfo) => {
    if (!this.isStarInfoInitialized()) {
      this._logger.trace("onStarInfo: Received starInfo.");
      this._starInfo = candidateStarInfo;

      if (this.isInitialized()) {
        this._logger.trace("onStarInfo: Star now initialized.");
        await this._initializeCatchup();
      }
    }
  };

  onStarProperties = async (signer, json) => {
    if (!this._canModifyProperties(signer)) {
      this._logger.trace("onStarProperties: Update rejected. Signer not allowed.");
      return;
    }

    const newProps = deserializeStarProperties(this._core, json);
    if (!newProps || newProps.utc <= this.properties.utc) {
      this._logger.trace("onStarProperties: Update rejected. Not newer than current.");
      return;
    }

    const wasInitialized = this.isInitialized();
    this._logger.trace("onStarProperties: Update accepted.");
    this._setProperties(newProps);

    if (!wasInitialized && this.isInitialized()) {
      this._logger.trace("onStarProperties: Star now initialized.");
      await this._initializeCatchup();
    }
  };

  onNewCid = async (signer, timestamp, cid) => {
    if (!this._canModifyData(signer)) {
      this._logger.trace("onNewCid: Update rejected. Signer not allowed.");
      return;
    }

    if (this._cidUtc && timestamp <= this._cidUtc.utc) {
      this._logger.trace("onNewCid: Update rejected. Not newer than current.");
      return;
    }

    this._logger.trace(`onNewCid: Update accepted. CID: '${cid}'.`);
    this._cidUtc = {
      cid: cid,
      utc: timestamp
    };

    if (!this.isInitialized()) {
      this._logger.warn("onNewCid: Skipping autoFetch and event handler: Star not initialized yet.");
      return;
    }

    await this._applyNewCid();
  };

  _initializeCatchup = async () => {
    // It's possible that we received a CID before we were initialized.
    // So we didn't process autofetch and event handler at that time.
    // We're initialized now! So if we have a CID, we should catch up:

    if (this._cidUtc) {
      this._logger.trace("_initializeCatchup: Catching up autoFetch and event handler...");
      await this._applyNewCid();
    }
  }

  _applyNewCid = async () => {
    if (this.autoFetch) {
      await this._core.codexService.fetchData(this._cidUtc.cid);
    }
    await this._handler.onDataChanged(this);
  };

  _canModifyData = (nodeId = this._core.constellationNode.address) => {
    if (this.starInfo.isOwner(nodeId)) return true;
    if (this.properties.isAdmin(nodeId)) return true;
    if (this.properties.isMod(nodeId)) return true;
    return false;
  };

  _canModifyProperties = (nodeId = this._core.constellationNode.address) => {
    if (this.starInfo.isOwner(nodeId)) return true;
    if (this.properties.isAdmin(nodeId)) return true;
    return false;
  };

  _setProperties = (newProps) => {
    this._properties = newProps;
    this._properties._canModifyProperties = this._canModifyProperties;
    this._properties._changeHandler = this._handleStarPropertiesChanged;
  }

  _handleStarPropertiesChanged = async (json) => {};
}
