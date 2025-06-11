import { StarInfo } from "./constellations/starInfo.js";

export async function createNewStarExample(core) {
  const nodeId = core.constellationNode.address;
  const owners = [nodeId];
  const starInfo = new StarInfo(core, "starType-example", owners, new Date());

  const handler = {
    onSomething: () => {
      // yes
    },
  };

  const channel = await core.starChannelManager.openByInfo(starInfo, handler);
}
