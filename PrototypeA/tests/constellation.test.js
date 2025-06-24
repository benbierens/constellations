import { beforeEach, describe, expect, it } from "vitest";
import { NullLogger } from "../src/services/logger";
import { ConstellationNode } from "../src/constellations/constellationNode";
import { Wallet } from "ethers";
import { CryptoService } from "../src/services/cryptoService";
import { Core } from "../src/constellations/core";
import {
  MockCodexService,
  MockWakuService,
  MockWakuServiceForSender,
} from "./mocks";
import { Constellation } from "../src/constellations/constellation";
import { getConstellationStarType } from "../src/constellations/protocol";

describe("ConstellationTest", () => {
  const logger = new NullLogger("ConstellationTest");
  const codexService = new MockCodexService();
  const wakuService = new MockWakuService();

  const doNothingStarHandler = {
    onDataChanged: async (star) => {},
    onPropertiesChanged: async (star) => {},
  };

  var onPathsUpdatedArgs = [];
  const constellationHandler = {
    onPathsUpdated: async (starId) => {
      onPathsUpdatedArgs.push(starId);
    },
  };

  function createCore(name) {
    const myLogger = logger.prefix(name);
    const wallet = Wallet.createRandom();
    const constellationNode = new ConstellationNode(wallet);
    const cryptoService = new CryptoService(constellationNode);

    const core = new Core(
      myLogger,
      constellationNode,
      new MockWakuServiceForSender(wakuService, constellationNode.address),
      codexService,
      cryptoService,
    );

    codexService._core = core;
    wakuService._core = core;

    return core;
  }

  var core1 = {};
  var id1 = "";
  var core2 = {};
  var id2 = "";

  beforeEach(() => {
    core1 = createCore("One");
    id1 = core1.constellationNode.address;
    core2 = createCore("Two");
    id2 = core2.constellationNode.address;
    onPathsUpdatedArgs = [];
  });

  async function createStar(core, type, handler) {
    const owners = [core.constellationNode.address];
    return await core.starFactory.createNewStar(type, owners, handler);
  }

  it("can open a simple constellation", async () => {
    const rootStar = await createStar(
      core1,
      getConstellationStarType(),
      doNothingStarHandler,
    );
    const leaf1 = await createStar(core1, "leaf_1", doNothingStarHandler);
    const leaf2 = await createStar(core1, "leaf_2", doNothingStarHandler);

    await rootStar.setData(
      JSON.stringify([
        {
          starId: leaf1.starId,
          path: "leaf1",
        },
        {
          starId: leaf2.starId,
          path: "leaf2",
        },
      ]),
    );

    const constellation = new Constellation(core2, constellationHandler);
    await constellation.initialize(rootStar.starId);

    expect(onPathsUpdatedArgs.length).toEqual(1);

    const root = constellation.root;
    expect(root.path).toEqual("");
    expect(root.starId).toEqual(rootStar.starId);
    expect(root.isActive).toBeTruthy();
    expect(root.entries.length).toEqual(2);

    expect(root.entries[0].path).toEqual("leaf1");
    expect(root.entries[0].starId).toEqual(leaf1.starId);
    expect(root.entries[0].isActive).toBeFalsy();
    expect(root.entries[0].entries.length).toEqual(0);
    
    expect(root.entries[1].path).toEqual("leaf2");
    expect(root.entries[1].starId).toEqual(leaf2.starId);
    expect(root.entries[1].isActive).toBeFalsy();
    expect(root.entries[1].entries.length).toEqual(0);
  });
});
