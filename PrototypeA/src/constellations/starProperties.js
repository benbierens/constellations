import {
  getAnnotationsUninitializedValue,
  getUserStringValueConstraintDescription,
  isValidUserStringValue,
} from "./protocol.js";
import {
  StarConfiguration,
  deserializeStarConfiguration,
  serializeStarConfiguration,
} from "./starConfiguration.js";

export const StarStatus = {
  Unknown: "unknown",
  Bright: "bright",
  Cold: "cold",
};

export class StarProperties {
  constructor(core) {
    this.logger = core.logger.prefix("StarProperties");

    this._status = StarStatus.Unknown;
    this._configuration = new StarConfiguration(core);
    this._admins = [];
    this._mods = [];
    this._annotations = getAnnotationsUninitializedValue();
    this._utc = new Date(0);

    this._hasChanged = false;
    this._canModifyProperties = () => {
      this.logger.assert(
        "_canModifyProperties: callback not initialized.",
      );
    };
    this._changeHandler = async (json) => {
      this.logger.assert("_changeHandler: callback not initialized.");
    };
  }

  get status() {
    return this._status;
  }

  set status(newValue) {
    if (!this._canModifyProperties()) {
      this.logger.trace("set status: Change not permitted.");
      return;
    }
    if (![StarStatus.Bright, StarStatus.Cold].includes(newValue))
      this.logger.errorAndThrow(
        `set status: Attempt to set StarStatus to unknown value: '${newValue}'`,
      );
    if (this._status == newValue) return;
    this._status = newValue;
    this._hasChanged = true;
  }

  get configuration() {
    return this._configuration;
  }

  get admins() {
    return this._admins;
  }

  set admins(newValue) {
    if (!this._canModifyProperties()) {
      this.logger.trace("set admins: Change not permitted.");
      return;
    }
    if (!Array.isArray(newValue))
      this.logger.errorAndThrow(
        "set admins: Attempt to set admins to non-array value",
      );
    if (this.core.arraysEqual(this._admins, newValue)) return;
    this._admins = newValue;
    this._hasChanged = true;
  }

  get mods() {
    return this._mods;
  }

  set mods(newValue) {
    if (!this._canModifyProperties()) {
      this.logger.trace("set mods: Change not permitted.");
      return;
    }
    if (!Array.isArray(newValue))
      this.logger.errorAndThrow(
        "set mods: Attempt to set mods to non-array value",
      );
    if (this.core.arraysEqual(this._mods, newValue)) return;
    this._mods = newValue;
    this._hasChanged = true;
  }

  get annotations() {
    return this._annotations;
  }

  set annotations(newValue) {
    if (!this._canModifyProperties()) {
      this.logger.trace("set annotations: Change not permitted.");
      return;
    }
    if (!(typeof newValue === "string" || newValue instanceof String))
      this.logger.errorAndThrow(
        "set annotations: Attempt to set annotations to non-string value",
      );
    if (!isValidUserStringValue(newValue))
      this.logger.errorAndThrow(
        `set annotations: provided value does not meet constraints: ${getUserStringValueConstraintDescription()}`,
      );
    if (this._annotations == newValue) return;
    this._annotations = newValue;
    this._hasChanged = true;
  }

  get utc() {
    return this._utc;
  }

  commitChanges = async () => {
    if (!this._hasChanged) {
      this.logger.trace("commitChanges: No changes.");
      return;
    }

    this._utc = new Date();
    this.logger.trace(
      "commitChanges: Sending starProperties to change handler...",
    );
    await this._changeHandler(serializeStarProperties(this));
    this._hasChanged = false;
  };

  isAdmin = (address) => {
    return this.admins.includes(address);
  };

  isMod = (address) => {
    return this.mods.includes(address);
  };
}

// StarProperties includes logger, which it needs but we don't want to serialize.
// so we have custom a serializer/deserializer here.
export function serializeStarProperties(properties) {
  return JSON.stringify({
    status: properties.status,
    configuration: serializeStarConfiguration(properties.configuration),
    admins: properties.admins,
    mods: properties.mods,
    annotations: properties.annotations,
    utc: properties.utc,
  });
}

export function deserializeStarProperties(core, json) {
  const obj = JSON.parse(json);
  var result = new StarProperties(core);
  result._status = obj.status;
  result._configuration = deserializeStarConfiguration(core, obj.configuration);
  result._admins = obj.admins;
  result._mods = obj.mods;
  result._annotations = obj.annotations;
  result._utc = obj.utc;
  return result;
}
