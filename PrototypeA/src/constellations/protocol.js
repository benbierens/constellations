export const packetHeaders = {
  requestStarInfo: "requestStarInfo",
  starInfo: "starInfo"

};

export function starIdToContentTopic(starId) {
  return `/constellations/1/${starId}/json`;
}

export function getRequestStarInfoMsg() {
  return JSON.stringify({
    header: packetHeaders.requestStarInfo
  });
}

export function getStarInfoMsg(starInfo) {
  return JSON.stringify({
    header: packetHeaders.starInfo,
    starInfo: {
      type: starInfo.type,
      owners: starInfo.owners,
      creationUtc: starInfo.creationUtc
    }
  });
}
