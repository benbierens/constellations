import { Column, ColumnUpdateCheckResponse } from "./column.js";
import { HealthMonitor } from "./healthMonitor.js";
import { isValidUserStringValue, packetHeaders } from "./protocol.js";
import { isDefaultConfiguration } from "./starConfiguration.js";
import { StarStatus } from "./starProperties.js";

export class StarInternal {
  constructor(core, starId, channel) {
    this._core = core;
    this._starId = starId;
    this._logger = core.logger.prefix("StarInternal");
    this._channel = channel;

    if (!this._starId) this._logger.errorAndThrow("starId not set.");

    this._starInfo = new Column(
      core,
      channel,
      "starInfo",
      packetHeaders.requestStarInfo,
      packetHeaders.responseStarInfo,
      {
        checkUpdate: this._starInfo_checkUpdate,
        onValueChanged: this._starInfo_onValueChanged,
      },
    );
    this._starProperties = new Column(
      core,
      channel,
      "starProperties",
      packetHeaders.requestStarProperties,
      packetHeaders.responseStarProperties,
      {
        checkUpdate: this._starProperties_checkUpdate,
        onValueChanged: this._starProperties_onValueChanged,
      },
    );
    this._cdxCid = new Column(
      core,
      channel,
      "cdxCid",
      packetHeaders.requestCdxCid,
      packetHeaders.responseCdxCid,
      {
        checkUpdate: this._cdxCid_checkUpdate,
        onValueChanged: this._cdxCid_onValueChanged,
      },
    );
  }

  init = (handler) => {
    if (this._handler) this._logger.errorAndThrow("init: Already initialized.");
    this._handler = handler;
  };

  get starId() {
    return this._starId;
  }

  get health() {
    if (!this._starProperties.isReady) {
      this._logger.error("get health: Accessed before initialized");
      return {};
    }
    return {
      channel: this._healthMonitor.channelHealth,
    };
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

  sendStarInfo = async (starInfo) => {
    if (this._starInfo.isReady)
      this._logger.errorAndThrow("sendStarInfo: Already set.");
    if (!starInfo.type)
      this._logger.errorAndThrow("sendStarInfo: type not set.");
    if (!starInfo.owners)
      this._logger.errorAndThrow("sendStarInfo: owners not set.");
    if (!starInfo.creationUtc)
      this._logger.errorAndThrow("sendStarInfo: creationUtc not set.");
    await this._starInfo.sendUpdate(starInfo);
  };

  sendStarProperties = async (starProperties) => {
    if (!this._starInfo.isReady)
      this._logger.errorAndThrow("sendStarProperties: StarInfo not set.");
    if (!starProperties.admins)
      this._logger.errorAndThrow("sendStarProperties: admins not set.");
    if (!starProperties.mods)
      this._logger.errorAndThrow("sendStarProperties: mods not set.");
    if (!starProperties.annotations)
      this._logger.errorAndThrow("sendStarProperties: annotations not set.");
    if (!isValidUserStringValue(starProperties.annotations))
      this._logger.errorAndThrow(
        "sendStarProperties: annotations: invalid user string value.",
      );
    if (!starProperties.status)
      this._logger.errorAndThrow("sendStarProperties: status not set.");
    if (
      starProperties.status != StarStatus.Bright &&
      starProperties.status != StarStatus.Cold
    )
      this._logger.errorAndThrow("sendStarProperties: status: Invalid value.");
    // todo validate config
    await this._starProperties.sendUpdate(starProperties);
  };

  sendCdxCid = async (cdxCid) => {
    if (!this._starInfo.isReady)
      this._logger.errorAndThrow("sendCdxCid: StarInfo not set.");
    if (cdxCid.length < 1)
      this._logger.errorAndThrow("sendCdxCid: Invalid value.");
    await this._cdxCid.sendUpdate(cdxCid);
  };

  onPacket = async (sender, packet) => {
    if (this._healthMonitor) {
      if (await this._healthMonitor.onPacket(sender, packet)) return;
    }
    if (await this._starInfo.processPacket(packet)) return;
    if (await this._starProperties.processPacket(packet)) return;
    if (await this._cdxCid.processPacket(packet)) return;

    this._logger.assert(`Unknown packet: '${packet.header}'`);
  };

  _starInfo_checkUpdate = async (signer, newValue) => {
    if (this._starInfo.isReady) return ColumnUpdateCheckResponse.Discard;

    const receivedStarId = this._core.generateStarId(newValue);
    if (!receivedStarId || receivedStarId != this._starId) {
      this._logger.error(
        "_starInfo_checkUpdate: Invalid starInfo values received.",
      );
      return ColumnUpdateCheckResponse.Discard;
    }

    if (newValue.owners.length > 0 && !newValue.owners.includes(signer)) {
      this._logger.error("_starInfo_checkUpdate: Update not signed by owner.");
      return ColumnUpdateCheckResponse.Discard;
    }

    return ColumnUpdateCheckResponse.Accept;
  };

  _starInfo_onValueChanged = async () => {
    await this._handler.onStarInfo(this._starInfo.value);
    await this._starProperties.applyDelayedUpdate();
  };

  _starProperties_checkUpdate = async (signer, newValue) => {
    if (!this._starInfo.isReady) return ColumnUpdateCheckResponse.Delay;

    const permittedModifiers = this.getAllowedPropertyModifiers();
    if (permittedModifiers.length > 0 && permittedModifiers.includes(signer)) {
      this._logger.trace(
        "_starProperties_checkUpdate: Update signed by owner or admin.",
      );
      return ColumnUpdateCheckResponse.Accept;
    }

    if (this._starProperties.isReady) {
      // properties are already known:
      if (permittedModifiers.length == 0) {
        // no owners no admins: only the annotations can be updated.
        // status is always bright, admins/mods always empty, config is always default.
        if (
          newValue.admins.length == 0 &&
          newValue.mods.length == 0 &&
          newValue.status == StarStatus.Bright &&
          isDefaultConfiguration(newValue.configuration) &&
          isValidUserStringValue(newValue.annotations)
        ) {
          this._logger.trace(
            "_starProperties_checkUpdate: No-owners-no-admins value restrictions check passed.",
          );
          return ColumnUpdateCheckResponse.Accept;
        }
        this._logger.trace(
          "_starProperties_checkUpdate: Update rejected: No-owners-no-admins value restriction no met.",
        );
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
        this._logger.assert(
          "big todo: no owners, how to receive first star properties?",
        );
      }
    }

    this._logger.trace(
      "_starProperties_checkUpdate: Update rejected: Signer not permitted.",
    );
    return ColumnUpdateCheckResponse.Discard;
  };

  _starProperties_onValueChanged = async () => {
    await this._handler.onStarProperties(this._starProperties.value);
    if (!this._cdxCid.isReady) {
      await this._cdxCid.applyDelayedUpdate();
    }

    this._logger.trace(
      "_starProperties_onValueChanged: Updating health monitor",
    );
    if (this._healthMonitor) {
      await this._healthMonitor.stop();
    }
    this._healthMonitor = new HealthMonitor(this._core, this._channel);
    await this._healthMonitor.start(this._starProperties.value.configuration);
  };

  _cdxCid_checkUpdate = async (signer, newValue) => {
    const permittedModifiers = this.getAllowedDataModifiers();
    if (permittedModifiers.length > 0 && permittedModifiers.includes(signer)) {
      this._logger.trace(
        "_cdxCid_checkUpdate: Update signed by owner, admin, or mod.",
      );
      return ColumnUpdateCheckResponse.Accept;
    }

    this._logger.trace(
      "_cdxCid_checkUpdate: Update rejected: Signer not permitted.",
    );
    return ColumnUpdateCheckResponse.Discard;
  };

  _cdxCid_onValueChanged = async () => {
    await this._handler.onCdxCid(this._cdxCid.value);
  };

  getAllowedPropertyModifiers = () => {
    if (!this._starInfo.isReady)
      this._logger.assert(
        "getAllowedPropertyModifiers: called before starInfo is ready.",
      );
    if (this._starProperties.isReady) {
      return this._starInfo.value.owners.concat(
        this._starProperties.value.admins,
      );
    }
    return this._starInfo.value.owners;
  };

  getAllowedDataModifiers = () => {
    if (!this._starInfo.isReady)
      this._logger.assert(
        "getAllowedDataModifiers: called before starInfo is ready.",
      );
    if (!this._starProperties.isReady)
      this._logger.assert(
        "getAllowedDataModifiers: called before starProperties is ready.",
      );
    return this._starInfo.value.owners
      .concat(this._starProperties.value.admins)
      .concat(this._starProperties.value.mods);
  };
}
