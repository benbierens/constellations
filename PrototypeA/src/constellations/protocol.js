export const constellationsProtocolVersion = 1;
export const systemValuePrefix = "_";

export const packetHeaders = {
  requestStarInfo: "requestStarInfo",
  starInfo: "starInfo",
  newCodexCid: "cdxCid",
};

export function starIdToContentTopic(starId) {
  return `/constellations/${constellationsProtocolVersion}/${starId}/json`;
}

export function getRequestStarInfoMsg() {
  return JSON.stringify({
    header: packetHeaders.requestStarInfo,
  });
}

export function getStarInfoMsg(starInfo) {
  return JSON.stringify({
    header: packetHeaders.starInfo,
    starInfo: {
      type: starInfo.type,
      owners: starInfo.owners,
      creationUtc: starInfo.creationUtc,
    },
  });
}

export function getNewCodexCidMsg(cid) {
  return JSON.stringify({
    header: packetHeaders.newCodexCid,
    cdxCid: cid,
  });
}

export function isValidUserStringValue(value) {
  // Type and annotations are user-settable string values.
  // These constraints apply:
  if (!(typeof value === 'string' || value instanceof String)) return false;
  if (value.length < 1) return false;
  if (value.length > 256) return false;
  if (value.startsWith(systemValuePrefix)) return false;
  return true;
}

export function getUserStringValueConstraintDescription() {
  return `User values must satisfy these constraints: Must be string. Length must be > 0 and < 256. Must not start with systemValuePrefix '${systemValuePrefix}'.`;
}
