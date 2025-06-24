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
  var core2 = {};

  beforeEach(() => {
    core1 = createCore("One");
    core2 = createCore("Two");
    onPathsUpdatedArgs = [];
  });

  async function createStar(core, type, handler) {
    const owners = [core.constellationNode.address];
    return await core.starFactory.createNewStar(type, owners, handler);
  }

  it("can initialize a simple constellation", async () => {
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
    expect(onPathsUpdatedArgs[0]).toEqual(rootStar.starId);

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

  it("can activate a nested constellation star", async () => {
    const rootStar = await createStar(
      core1,
      getConstellationStarType(),
      doNothingStarHandler,
    );
    const folder = await createStar(
      core1,
      getConstellationStarType(),
      doNothingStarHandler,
    );
    const leaf = await createStar(core1, "leaf", doNothingStarHandler);

    await rootStar.setData(
      JSON.stringify([
        {
          starId: folder.starId,
          path: "folder",
        },
      ]),
    );
    await folder.setData(
      JSON.stringify([
        {
          starId: leaf.starId,
          path: "leaf",
        },
      ]),
    );

    const constellation = new Constellation(core2, constellationHandler);
    await constellation.initialize(rootStar.starId);
    expect(onPathsUpdatedArgs.length).toEqual(1);
    expect(onPathsUpdatedArgs[0]).toEqual(rootStar.starId);

    var root = constellation.root;
    expect(root.path).toEqual("");
    expect(root.starId).toEqual(rootStar.starId);
    expect(root.isActive).toBeTruthy();
    expect(root.entries.length).toEqual(1);

    expect(root.entries[0].path).toEqual("folder");
    expect(root.entries[0].starId).toEqual(folder.starId);
    expect(root.entries[0].isActive).toBeFalsy();
    expect(root.entries[0].entries.length).toEqual(0);

    // when we activate the folder, we expect another update event.
    // after that, we expect the leaf to be visible.
    await constellation.activate(["folder"]);
    await core1.sleep(100);
    expect(onPathsUpdatedArgs.length).toEqual(2);
    expect(onPathsUpdatedArgs[1]).toEqual(folder.starId);

    root = constellation.root;
    expect(root.path).toEqual("");
    expect(root.starId).toEqual(rootStar.starId);
    expect(root.isActive).toBeTruthy();
    expect(root.entries.length).toEqual(1);

    expect(root.entries[0].path).toEqual("folder");
    expect(root.entries[0].starId).toEqual(folder.starId);
    expect(root.entries[0].isActive).toBeTruthy(); // Is now activated.
    expect(root.entries[0].entries.length).toEqual(1); // Has 1 entry.

    expect(root.entries[0].entries[0].path).toEqual("leaf");
    expect(root.entries[0].entries[0].starId).toEqual(leaf.starId);
    expect(root.entries[0].entries[0].isActive).toBeFalsy();
    expect(root.entries[0].entries[0].entries.length).toEqual(0);
  });

  it("can deactivate a nested constellation star", async () => {
    const rootStar = await createStar(
      core1,
      getConstellationStarType(),
      doNothingStarHandler,
    );
    const folder = await createStar(
      core1,
      getConstellationStarType(),
      doNothingStarHandler,
    );
    const leaf = await createStar(core1, "leaf", doNothingStarHandler);

    await rootStar.setData(
      JSON.stringify([
        {
          starId: folder.starId,
          path: "folder",
        },
      ]),
    );
    await folder.setData(
      JSON.stringify([
        {
          starId: leaf.starId,
          path: "leaf",
        },
      ]),
    );

    const constellation = new Constellation(core2, constellationHandler);
    await constellation.initialize(rootStar.starId);
    expect(onPathsUpdatedArgs.length).toEqual(1);
    expect(onPathsUpdatedArgs[0]).toEqual(rootStar.starId);

    var root = constellation.root;
    // when we activate the folder, we expect another update event.
    // after that, we expect the leaf to be visible.
    await constellation.activate(["folder"]);
    await core1.sleep(100);
    expect(onPathsUpdatedArgs.length).toEqual(2);
    expect(onPathsUpdatedArgs[1]).toEqual(folder.starId);

    root = constellation.root;
    expect(root.entries.length).toEqual(1); // root
    expect(root.entries[0].isActive).toBeTruthy();
    expect(root.entries[0].entries.length).toEqual(1); // folder
    expect(root.entries[0].entries[0].entries.length).toEqual(0); // leaf

    // We deactivate the folder, expecting another update event
    // and expecting the leaf to disappear from view.
    await constellation.deactivate(["folder"]);
    await core1.sleep(100);

    expect(onPathsUpdatedArgs.length).toEqual(3);
    expect(onPathsUpdatedArgs[1]).toEqual(folder.starId);

    root = constellation.root;
    expect(root.path).toEqual("");
    expect(root.starId).toEqual(rootStar.starId);
    expect(root.isActive).toBeTruthy();
    expect(root.entries.length).toEqual(1);

    expect(root.entries[0].path).toEqual("folder");
    expect(root.entries[0].starId).toEqual(folder.starId);
    expect(root.entries[0].isActive).toBeFalsy();
    expect(root.entries[0].entries.length).toEqual(0);
  });

  it("returns star info, size, lastChange, health, autofetch, and properties", async () => {
    const rootStar = await createStar(
      core1,
      getConstellationStarType(),
      doNothingStarHandler,
    );
    const leafStar = await createStar(core1, "leaf", doNothingStarHandler);
    await rootStar.setData(
      JSON.stringify([
        {
          starId: leafStar.starId,
          path: "leaf",
        },
      ]),
    );

    const constellation = new Constellation(core2, constellationHandler);
    await constellation.initialize(rootStar.starId);
    expect(onPathsUpdatedArgs.length).toEqual(1);

    const rootInfo = constellation.info([]);
    expect(rootInfo.starId).toEqual(rootStar.starId);
    expect(rootInfo.path.length).toEqual(0);
    expect(rootInfo.starInfo.type).toEqual(getConstellationStarType());
    expect(rootInfo.starInfo).toStrictEqual(rootStar.starInfo);
    expect(rootInfo.health).toStrictEqual(rootStar.health);
    expect(rootInfo.properties.admins.length).toEqual(0);
    expect(rootInfo.properties.mods.length).toEqual(0);
    expect(rootInfo.properties.annotations).toEqual(
      rootStar.properties.annotations,
    );
    expect(rootInfo.properties.status).toEqual(rootStar.properties.status);
    expect(rootInfo.properties.configuration.maxDiffSize).toEqual(
      rootStar.properties.configuration.maxDiffSize,
    );
    expect(rootInfo.properties.configuration.softMinSnapshotDuration).toEqual(
      rootStar.properties.configuration.softMinSnapshotDuration,
    );
    expect(rootInfo.properties.configuration.softMaxDiffDuration).toEqual(
      rootStar.properties.configuration.softMaxDiffDuration,
    );
    expect(rootInfo.properties.configuration.softMaxNumDiffs).toEqual(
      rootStar.properties.configuration.softMaxNumDiffs,
    );
    expect(rootInfo.properties.configuration.channelMonitoringMinutes).toEqual(
      rootStar.properties.configuration.channelMonitoringMinutes,
    );
    expect(rootInfo.properties.configuration.cidMonitoringMinutes).toEqual(
      rootStar.properties.configuration.cidMonitoringMinutes,
    );

    await constellation.activate(["leaf"]);

    const leafInfo = constellation.info(["leaf"]);
    expect(leafInfo.starId).toEqual(leafStar.starId);
    expect(leafInfo.path.length).toEqual(1);
    expect(leafInfo.path[0]).toEqual("leaf");
    expect(leafInfo.starInfo.type).toEqual("leaf");
    expect(leafInfo.starInfo).toStrictEqual(leafStar.starInfo);
    expect(leafInfo.health).toStrictEqual(leafStar.health);
    expect(leafInfo.properties.admins.length).toEqual(0);
    expect(leafInfo.properties.mods.length).toEqual(0);
    expect(leafInfo.properties.annotations).toEqual(
      leafStar.properties.annotations,
    );
    expect(leafInfo.properties.status).toEqual(leafStar.properties.status);
    expect(leafInfo.properties.configuration.maxDiffSize).toEqual(
      leafStar.properties.configuration.maxDiffSize,
    );
    expect(leafInfo.properties.configuration.softMinSnapshotDuration).toEqual(
      leafStar.properties.configuration.softMinSnapshotDuration,
    );
    expect(leafInfo.properties.configuration.softMaxDiffDuration).toEqual(
      leafStar.properties.configuration.softMaxDiffDuration,
    );
    expect(leafInfo.properties.configuration.softMaxNumDiffs).toEqual(
      leafStar.properties.configuration.softMaxNumDiffs,
    );
    expect(leafInfo.properties.configuration.channelMonitoringMinutes).toEqual(
      leafStar.properties.configuration.channelMonitoringMinutes,
    );
    expect(leafInfo.properties.configuration.cidMonitoringMinutes).toEqual(
      leafStar.properties.configuration.cidMonitoringMinutes,
    );
  });
});
