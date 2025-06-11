import { createNewStarInfo } from "./constellations/starInfo";

export async function createNewStarExample(core) {

  const nodeId = core.constellationNode.address;
  const owners = [nodeId];
  const starInfo = createNewStarInfo(core, "starType-example", owners);

  const handler = {
    onSomething: () => {
      // yes
    }
  };

  const channel = await core.starChannelManager.openByInfo(starInfo, handler);

}
