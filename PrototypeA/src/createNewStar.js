import { Star } from "./constellations/star.js";
import { StarInfo } from "./constellations/starInfo.js";

export async function createNewStarExample(core) {
  const nodeId = core.constellationNode.address;
  const owners = [nodeId];
  const starInfo = new StarInfo(core, "starType-example", owners, new Date());

  const handler = {
    onNewCid: async (cid) => {
      core.logger.trace("(APPLICATION) received new CID");
    },
  };

  const channel = await core.starChannelManager.openByInfo(starInfo, handler);
  const star = new Star(core, starInfo, channel);

  const theData = "ThisIsTheData!";
  await star.setData(theData);
}
