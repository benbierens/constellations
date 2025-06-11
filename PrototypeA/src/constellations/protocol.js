export const constellationsProtocolVersion = 1;

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
