export class StarConfiguration {
  constructor(core) {
    this.core = core;
    this.logger = core.logger.prefix("StarConfiguration");
  }

  // entirely todo:
  // these config values relate to the handling of diffs
  // and detection of star health.
}

export function serializeStarConfiguration(configuration) {
  return JSON.stringify({
    // todo
  });
}

export function deserializeStarConfiguration(core, json) {
  const obj = JSON.parse(json);
  var result = new StarConfiguration(core);
  // todo
  return result;
}

export function isDefaultConfiguration(config) {
  return true;
}
