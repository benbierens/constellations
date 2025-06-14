import { Column, ColumnUpdateCheckResponse } from "./column";
import { isValidUserStringValue, packetHeaders } from "./protocol";
import { isDefaultConfiguration } from "./starConfiguration";
import { StarStatus } from "./starProperties";

const exampleHandler = {
    onStarInfo: async (starInfo) => { },
    onStarProperties: async (starProperties) => { },
    onCdxCid: async (cdxCid) => { }
};

export class StarInternal {
  constructor(core, starId, handler, channel) {
    this._core = core;
    this._starId = starId;
    this._logger = core.logger.prefix("StarInternal");
    this._handler = handler;
    this._channel = channel;

    if (!this._starId) this._logger.errorAndThrow("starId not set.");

    this._starInfo = new Column(core, channel, "starInfo", packetHeaders.requestStarInfo, packetHeaders.responseStarInfo, {
      checkUpdate: this._starInfo_checkUpdate,
      onValueChanged: this._starInfo_onValueChanged
    });
    this._starProperties = new Column(core, channel, "starProperties", packetHeaders.requestStarProperties, packetHeaders.responseStarProperties, {
      checkUpdate: this._starProperties_checkUpdate,
      onValueChanged: this._starProperties_onValueChanged
    });
    this._cdxCid = new Column(core, channel, "cdxCid", packetHeaders.requestCdxCid, packetHeaders.responseCdxCid, {
      checkUpdate: this._cdxCid_checkUpdate,
      onValueChanged: this._cdxCid_onValueChanged
    });
  }

  disconnect = async () => {
    this._logger.trace("disconnect: Disconnecting...");
    await this._channel.close();
    this._starInfo.close();
    this._starProperties.close();
    this._cdxCid.close();

    // Clean up everything, prevent accidental use.
    this._core = null;
    this._starId = null;
    this._logger = null;
    this._handler = null;
    this._channel = null;

    this._starInfo = null;
    this._starProperties = null;
    this._cdxCid = null;
  };

  onPacket = async (packet) => {
    if (await this._starInfo.processPacket(packet)) return;
    if (await this._starProperties.processPacket(packet)) return;
    if (await this._cdxCid.processPacket(packet)) return;

    this._logger.assert(`Unknown packet: '${packet.header}'`);
  }

  _starInfo_checkUpdate = async (signer, newValue) => {
    if (this._starInfo.isReady) return ColumnUpdateCheckResponse.Discard;

    const receivedStarId = this.core.generateStarId(newValue);
    if (!receivedStarId || receivedStarId != this._starId) {
      this._logger.error("_starInfo_checkUpdate: Invalid starInfo values received.");
      return ColumnUpdateCheckResponse.Discard;
    }

    if (newValue.owners.length > 0 && !newValue.owners.includes(signer)) {
      this._logger.error("_starInfo_checkUpdate: Update not signed by owner.");
      return ColumnUpdateCheckResponse.Discard;
    }

    return ColumnUpdateCheckResponse.Accept;
  }

  _starInfo_onValueChanged = async () => {
    await this._handler.onStarInfo(this._starInfo.value);
    await this._starProperties.applyDelayedUpdate();
  }

  _starProperties_checkUpdate = async (signer, newValue) => {
    if (!this._starInfo.isReady) return ColumnUpdateCheckResponse.Delay;

    const permittedModifiers = this._getAllowedPropertyModifiers();
    if (permittedModifiers.length > 0 && permittedModifiers.includes(signer)) {
      this._logger.trace("_starProperties_checkUpdate: Update signed by owner or admin.");
      return ColumnUpdateCheckResponse.Accept;
    }

    if (this._starProperties.isReady) {
      // properties are already known:
      if (permittedModifiers.length == 0) {
        // no owners no admins: only the annotations can be updated.
        // status is always bright, admins/mods always empty, config is always default.
        if (newValue.admins.length == 0 &&
            newValue.mods.length == 0 &&
            newValue.status == StarStatus.Bright &&
            isDefaultConfiguration(newValue.configuration) &&
            isValidUserStringValue(newValue.annotations)) {
          this._logger.trace("_starProperties_checkUpdate: No-owners-no-admins value restrictions check passed.");
          return ColumnUpdateCheckResponse.Accept;
        }
        this._logger.trace("_starProperties_checkUpdate: Update rejected: No-owners-no-admins value restriction no met.");
        return ColumnUpdateCheckResponse.Discard;
      }
    } else {
      // properties are not known yet:
      if (permittedModifiers.length == 0) {
        // big todo:
        // modifications are only permitted by the owners.
        // There are no owners, TODO: who can set the properties?
        // the person who created the star... who was that?
        // - no owners/no admins = we want the dataset to be openly modifiable (think: forum-thread)
        // but we want to protect it from malicious modifications: someone coming in to setting the data
        // to null or status to cold.
        // if we enforce the same no-owners-no-admins restriction as above, then it's impossible
        // to create a star without owner but with admin.
        // should we disallow no-owners? what use-cases are served by no-owners stars?
        this._logger.assert("big todo: no owners, how to receive first star properties?");
      }
    }

    this._logger.trace("_starProperties_checkUpdate: Update rejected: Signer not permitted.");
    return ColumnUpdateCheckResponse.Discard;
  }

  _starProperties_onValueChanged = async () => {
    await this._handler.onStarProperties(this._starProperties.value);
    if (!this._cdxCid.isReady()) {
      await this._cdxCid.applyDelayedUpdate();
    }
  }
  
  _cdxCid_checkUpdate = async (signer, newValue) => {
    const permittedModifiers = this._getAllowedDataModifiers();
    if (permittedModifiers.length > 0 && permittedModifiers.includes(signer)) {
      this._logger.trace("_cdxCid_checkUpdate: Update signed by owner, admin, or mod.");
      return ColumnUpdateCheckResponse.Accept;
    }

    this._logger.trace("_cdxCid_checkUpdate: Update rejected: Signer not permitted.");
    return ColumnUpdateCheckResponse.Discard;
  }

  _cdxCid_onValueChanged = async () => {
    await this._handler.onCdxCid(this._cdxCid.value);
  }

  _getAllowedPropertyModifiers = () => {
    if (!this._starInfo.isReady()) this._logger.assert("_getAllowedPropertyModifiers: called before starInfo is ready.");
    if (this._starProperties.isReady()) {
      return this.starInfo.value.owners.concat(this._starProperties.value.admins);
    }
    return this.starInfo.value.owners; 
  }

  _getAllowedDataModifiers = () => {
    if (!this._starInfo.isReady()) this._logger.assert("_getAllowedDataModifiers: called before starInfo is ready.");
    if (!this._starProperties.isReady()) this._logger.assert("_getAllowedDataModifiers: called before starProperties is ready.");
    return this.starInfo.value.owners.concat(this._starProperties.value.admins).concat(this._starProperties.value.mods);
  }
}
