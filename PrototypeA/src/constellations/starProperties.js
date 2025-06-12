import { getUserStringValueConstraintDescription, isValidUserStringValue } from "./protocol";
import { StarConfiguration, deserializeStarConfiguration } from "./starConfiguration";

export const StarStatus = {
  Unknown: "unknown",
  Bright: "bright",
  Cold: "cold"
};

export class StarProperties {
  constructor(core) {
    this.logger = core.logger.prefix("StarProperties");

    this._status = StarStatus.Unknown;
    this._configuration = new StarConfiguration(core);
    this._admins = [];
    this._mods = [];
    this._annotations = "uninitialized";
    this._utc = new Date(0);
  }

  get status() {
    return this._status;
  } 

  set status(newValue) {
    if (![StarStatus.Bright, StarStatus.Cold].includes(newValue)) this.logger.errorAndThrow(`set status: Attempt to set StarStatus to unknown value: '${newValue}'`);
      this._status = newValue
  }

  get configuration() {
    return this._configuration;
  }

  get admins() {
    return this._admins;
  }

  set admins(newValue) {
    if (!Array.isArray(newValue)) this.logger.errorAndThrow("set admins: Attempt to set admins to non-array value");
    this._admins = newValue;
  }
  
  get mods() {
    return this._mods;
  }

  set mods(newValue) {
    if (!Array.isArray(newValue)) this.logger.errorAndThrow("set mods: Attempt to set mods to non-array value");
    this._mods = newValue;
  }
  
  get annotations() {
    return this._annotations;
  }

  set annotations(newValue) {
    if (!(typeof newValue === 'string' || newValue instanceof String)) this.logger.errorAndThrow("set annotations: Attempt to set annotations to non-string value");
    if (!isValidUserStringValue(newValue)) this.logger.errorAndThrow(`set annotations: provided value does not meet constraints: ${getUserStringValueConstraintDescription()}`);
    this._annotations = newValue;
  }

  get utc() {
    return this._utc;
  }

  set utc(newValue) {
    if (newValue > (new Date() - 3000)) { // We tolerate a 3-second difference in system times. Is this a good idea?
      this.logger.error("set utc: Attempt to set utc to a moment in the future. Ignored.");
      return;
    }
    this._utc = newValue;
  }
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
    utc: properties.utc
  });
}

export function deserializeStarProperties(core, json) {
  const obj = JSON.parse(json);
  var result = new StarProperties(core);
  result.status = obj.status;
  result.configuration = deserializeStarConfiguration(obj.configuration);
  result.admins = obj.admins;
  result.mods = obj.mods;
  result.annotations = obj.annotations;
  result.utc = obj.utc;
  return result;
}