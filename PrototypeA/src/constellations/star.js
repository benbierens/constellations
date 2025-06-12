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

    this._properties = properties;
    this._properties._canModifyProperties = this._canModifyProperties;
    this._properties._changeHandler = this._handleStarPropertiesChanged;
    this._starInfo = null;
    this._cid = null;
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
    this._cid = null;
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
    if (!this._cid)
      this._logger.errorAndThrow("getData: No CID known for star.");
    return await this._core.codexService.downloadData(this._cid);
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

  onStarInfo = (candidateStarInfo) => {
    if (!this.isStarInfoInitialized()) {
      this._logger.trace("onStarInfo: Received starInfo.");
      this._starInfo = candidateStarInfo;
    }
  };

  onStarProperties = (signer, json) => {
    if (this._canModifyProperties(signer)) {
      this._logger.trace("onStarProperties: Update accepted.");
      this._properties = deserializeStarProperties(this._core, json);
    } else {
      this._logger.trace(
        "onStarProperties: Update rejected. Signer not allowed.",
      );
    }
  };

  onNewCid = async (signer, cid) => {
    if (!this.isInitialized()) {
      this._logger.trace("onNewCid: Ignored. Star not initialized.");
      return;
    }

    this._logger.trace(`onNewCid: Received '${cid}'.`);
    this._cid = cid;

    if (this.autoFetch) {
      await this._core.codexService.fetchData(cid);
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

  _handleStarPropertiesChanged = async (json) => {};
}
