export const constellationsProtocolVersion = 1;
export const systemValuePrefix = "_";

export const packetHeaders = {
  requestStarInfo: "requestStarInfo",
  requestStarProperties: "requestStarProperties",
  requestCdxCid: "requestCdxCid",
  responseStarInfo: "responseStarInfo",
  responseStarProperties: "responseStarProperties",
  responseCdxCid: "responseCdxCid",

  healthChannel: "hChn",
  healthCid: "hCid",
};

export function starIdToContentTopic(starId) {
  return `/constellations/${constellationsProtocolVersion}/${starId}/json`;
}

export function isValidUserStringValue(value) {
  // Type and annotations are user-settable string values.
  // These constraints apply:
  if (!(typeof value === "string" || value instanceof String)) return false;
  if (value.length < 1) return false;
  if (value.length > 256) return false;
  if (value.startsWith(systemValuePrefix)) return false;
  return true;
}

export function getUserStringValueConstraintDescription() {
  return `User values must satisfy these constraints: Must be string. Length must be > 0 and < 256. Must not start with systemValuePrefix '${systemValuePrefix}'.`;
}

export function getAnnotationsUninitializedValue() {
  return `${systemValuePrefix}uninitialized`;
}

export function getConstellationStarType() {
  return `${systemValuePrefix}constellation`;
}
