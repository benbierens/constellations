import { beforeEach, describe, expect, it } from "vitest";
import { Logger, NullLogger } from "../src/services/logger";
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
import { StarStatus } from "../src/constellations/starProperties";

describe("ConstellationTest", () => {
  const logger = new Logger("ConstellationTest");
  const codexService = new MockCodexService();
  const wakuService = new MockWakuService();

  const doNothingStarHandler = {
    onDataChanged: async (star) => {},
    onPropertiesChanged: async (star) => {},
  };

  var onPathsUpdatedArgs = [];
  var onPropertiesChangedArgs = [];
  var onDataChangedArgs = [];
  const constellationHandler = {
    onPathsUpdated: async (starId) => {
      onPathsUpdatedArgs.push(starId);
    },
    onPropertiesChanged: async (starId) => {
      onPropertiesChangedArgs.push(starId);
    },
    onDataChanged: async (starId) => {
      onDataChangedArgs.push(starId);
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
    onPropertiesChangedArgs = [];
    onDataChangedArgs = [];
  });

  async function createStar(core, type, handler) {
    const owners = [core.constellationNode.address];
    return await core.starFactory.createNewStar(type, owners, handler);
  }

  // it("can initialize a simple constellation", async () => {
  //   const rootStar = await createStar(
  //     core1,
  //     getConstellationStarType(),
  //     doNothingStarHandler,
  //   );
  //   const leaf1 = await createStar(core1, "leaf_1", doNothingStarHandler);
  //   const leaf2 = await createStar(core1, "leaf_2", doNothingStarHandler);

  //   await rootStar.setData(
  //     JSON.stringify([
  //       {
  //         starId: leaf1.starId,
  //         path: "leaf1",
  //       },
  //       {
  //         starId: leaf2.starId,
  //         path: "leaf2",
  //       },
  //     ]),
  //   );

  //   const constellation = new Constellation(core2, constellationHandler);
  //   await constellation.initialize(rootStar.starId);

  //   expect(onPathsUpdatedArgs.length).toEqual(1);
  //   expect(onPathsUpdatedArgs[0]).toEqual(rootStar.starId);

  //   const root = constellation.root;
  //   expect(root.path).toEqual("");
  //   expect(root.starId).toEqual(rootStar.starId);
  //   expect(root.isActive).toBeTruthy();
  //   expect(root.entries.length).toEqual(2);

  //   expect(root.entries[0].path).toEqual("leaf1");
  //   expect(root.entries[0].starId).toEqual(leaf1.starId);
  //   expect(root.entries[0].isActive).toBeFalsy();
  //   expect(root.entries[0].entries.length).toEqual(0);

  //   expect(root.entries[1].path).toEqual("leaf2");
  //   expect(root.entries[1].starId).toEqual(leaf2.starId);
  //   expect(root.entries[1].isActive).toBeFalsy();
  //   expect(root.entries[1].entries.length).toEqual(0);
  // });

  // it("can activate a nested constellation star", async () => {
  //   const rootStar = await createStar(
  //     core1,
  //     getConstellationStarType(),
  //     doNothingStarHandler,
  //   );
  //   const folder = await createStar(
  //     core1,
  //     getConstellationStarType(),
  //     doNothingStarHandler,
  //   );
  //   const leaf = await createStar(core1, "leaf", doNothingStarHandler);

  //   await rootStar.setData(
  //     JSON.stringify([
  //       {
  //         starId: folder.starId,
  //         path: "folder",
  //       },
  //     ]),
  //   );
  //   await folder.setData(
  //     JSON.stringify([
  //       {
  //         starId: leaf.starId,
  //         path: "leaf",
  //       },
  //     ]),
  //   );

  //   const constellation = new Constellation(core2, constellationHandler);
  //   await constellation.initialize(rootStar.starId);
  //   expect(onPathsUpdatedArgs.length).toEqual(1);
  //   expect(onPathsUpdatedArgs[0]).toEqual(rootStar.starId);

  //   var root = constellation.root;
  //   expect(root.path).toEqual("");
  //   expect(root.starId).toEqual(rootStar.starId);
  //   expect(root.isActive).toBeTruthy();
  //   expect(root.entries.length).toEqual(1);

  //   expect(root.entries[0].path).toEqual("folder");
  //   expect(root.entries[0].starId).toEqual(folder.starId);
  //   expect(root.entries[0].isActive).toBeFalsy();
  //   expect(root.entries[0].entries.length).toEqual(0);

  //   // when we activate the folder, we expect another update event.
  //   // after that, we expect the leaf to be visible.
  //   await constellation.activate(["folder"]);
  //   await core1.sleep(100);
  //   expect(onPathsUpdatedArgs.length).toEqual(2);
  //   expect(onPathsUpdatedArgs[1]).toEqual(folder.starId);

  //   root = constellation.root;
  //   expect(root.path).toEqual("");
  //   expect(root.starId).toEqual(rootStar.starId);
  //   expect(root.isActive).toBeTruthy();
  //   expect(root.entries.length).toEqual(1);

  //   expect(root.entries[0].path).toEqual("folder");
  //   expect(root.entries[0].starId).toEqual(folder.starId);
  //   expect(root.entries[0].isActive).toBeTruthy(); // Is now activated.
  //   expect(root.entries[0].entries.length).toEqual(1); // Has 1 entry.

  //   expect(root.entries[0].entries[0].path).toEqual("leaf");
  //   expect(root.entries[0].entries[0].starId).toEqual(leaf.starId);
  //   expect(root.entries[0].entries[0].isActive).toBeFalsy();
  //   expect(root.entries[0].entries[0].entries.length).toEqual(0);
  // });

  // it("can deactivate a nested constellation star", async () => {
  //   const rootStar = await createStar(
  //     core1,
  //     getConstellationStarType(),
  //     doNothingStarHandler,
  //   );
  //   const folder = await createStar(
  //     core1,
  //     getConstellationStarType(),
  //     doNothingStarHandler,
  //   );
  //   const leaf = await createStar(core1, "leaf", doNothingStarHandler);

  //   await rootStar.setData(
  //     JSON.stringify([
  //       {
  //         starId: folder.starId,
  //         path: "folder",
  //       },
  //     ]),
  //   );
  //   await folder.setData(
  //     JSON.stringify([
  //       {
  //         starId: leaf.starId,
  //         path: "leaf",
  //       },
  //     ]),
  //   );

  //   const constellation = new Constellation(core2, constellationHandler);
  //   await constellation.initialize(rootStar.starId);
  //   expect(onPathsUpdatedArgs.length).toEqual(1);
  //   expect(onPathsUpdatedArgs[0]).toEqual(rootStar.starId);

  //   var root = constellation.root;
  //   // when we activate the folder, we expect another update event.
  //   // after that, we expect the leaf to be visible.
  //   await constellation.activate(["folder"]);
  //   await core1.sleep(100);
  //   expect(onPathsUpdatedArgs.length).toEqual(2);
  //   expect(onPathsUpdatedArgs[1]).toEqual(folder.starId);

  //   root = constellation.root;
  //   expect(root.entries.length).toEqual(1); // root
  //   expect(root.entries[0].isActive).toBeTruthy();
  //   expect(root.entries[0].entries.length).toEqual(1); // folder
  //   expect(root.entries[0].entries[0].entries.length).toEqual(0); // leaf

  //   // We deactivate the folder, expecting another update event
  //   // and expecting the leaf to disappear from view.
  //   await constellation.deactivate(["folder"]);
  //   await core1.sleep(100);

  //   expect(onPathsUpdatedArgs.length).toEqual(3);
  //   expect(onPathsUpdatedArgs[1]).toEqual(folder.starId);

  //   root = constellation.root;
  //   expect(root.path).toEqual("");
  //   expect(root.starId).toEqual(rootStar.starId);
  //   expect(root.isActive).toBeTruthy();
  //   expect(root.entries.length).toEqual(1);

  //   expect(root.entries[0].path).toEqual("folder");
  //   expect(root.entries[0].starId).toEqual(folder.starId);
  //   expect(root.entries[0].isActive).toBeFalsy();
  //   expect(root.entries[0].entries.length).toEqual(0);
  // });

  // it("returns star info, size, lastChange, health, autofetch, and properties", async () => {
  //   const rootStar = await createStar(
  //     core1,
  //     getConstellationStarType(),
  //     doNothingStarHandler,
  //   );
  //   const leafStar = await createStar(core1, "leaf", doNothingStarHandler);
  //   await rootStar.setData(
  //     JSON.stringify([
  //       {
  //         starId: leafStar.starId,
  //         path: "leaf",
  //       },
  //     ]),
  //   );

  //   const constellation = new Constellation(core2, constellationHandler);
  //   await constellation.initialize(rootStar.starId);
  //   expect(onPathsUpdatedArgs.length).toEqual(1);

  //   const rootInfo = constellation.info([]);
  //   expect(rootInfo.starId).toEqual(rootStar.starId);
  //   expect(rootInfo.path.length).toEqual(0);
  //   expect(rootInfo.starInfo.type).toEqual(getConstellationStarType());
  //   expect(rootInfo.starInfo).toStrictEqual(rootStar.starInfo);
  //   expect(rootInfo.health).toStrictEqual(rootStar.health);
  //   expect(rootInfo.size).toEqual(rootStar.size);
  //   expect(rootInfo.lastChangeUtc).toEqual(rootStar.lastChangeUtc);
  //   expect(rootInfo.properties.admins.length).toEqual(0);
  //   expect(rootInfo.properties.mods.length).toEqual(0);
  //   expect(rootInfo.properties.annotations).toEqual(
  //     rootStar.properties.annotations,
  //   );
  //   expect(rootInfo.properties.status).toEqual(rootStar.properties.status);
  //   expect(rootInfo.properties.configuration.maxDiffSize).toEqual(
  //     rootStar.properties.configuration.maxDiffSize,
  //   );
  //   expect(rootInfo.properties.configuration.softMinSnapshotDuration).toEqual(
  //     rootStar.properties.configuration.softMinSnapshotDuration,
  //   );
  //   expect(rootInfo.properties.configuration.softMaxDiffDuration).toEqual(
  //     rootStar.properties.configuration.softMaxDiffDuration,
  //   );
  //   expect(rootInfo.properties.configuration.softMaxNumDiffs).toEqual(
  //     rootStar.properties.configuration.softMaxNumDiffs,
  //   );
  //   expect(rootInfo.properties.configuration.channelMonitoringMinutes).toEqual(
  //     rootStar.properties.configuration.channelMonitoringMinutes,
  //   );
  //   expect(rootInfo.properties.configuration.cidMonitoringMinutes).toEqual(
  //     rootStar.properties.configuration.cidMonitoringMinutes,
  //   );

  //   await constellation.activate(["leaf"]);

  //   const leafInfo = constellation.info(["leaf"]);
  //   expect(leafInfo.starId).toEqual(leafStar.starId);
  //   expect(leafInfo.path.length).toEqual(1);
  //   expect(leafInfo.path[0]).toEqual("leaf");
  //   expect(leafInfo.starInfo.type).toEqual("leaf");
  //   expect(leafInfo.starInfo).toStrictEqual(leafStar.starInfo);
  //   expect(leafInfo.health).toStrictEqual(leafStar.health);
  //   expect(leafInfo.size).toEqual(leafStar.size);
  //   expect(leafInfo.lastChangeUtc).toEqual(leafStar.lastChangeUtc);
  //   expect(leafInfo.properties.admins.length).toEqual(0);
  //   expect(leafInfo.properties.mods.length).toEqual(0);
  //   expect(leafInfo.properties.annotations).toEqual(
  //     leafStar.properties.annotations,
  //   );
  //   expect(leafInfo.properties.status).toEqual(leafStar.properties.status);
  //   expect(leafInfo.properties.configuration.maxDiffSize).toEqual(
  //     leafStar.properties.configuration.maxDiffSize,
  //   );
  //   expect(leafInfo.properties.configuration.softMinSnapshotDuration).toEqual(
  //     leafStar.properties.configuration.softMinSnapshotDuration,
  //   );
  //   expect(leafInfo.properties.configuration.softMaxDiffDuration).toEqual(
  //     leafStar.properties.configuration.softMaxDiffDuration,
  //   );
  //   expect(leafInfo.properties.configuration.softMaxNumDiffs).toEqual(
  //     leafStar.properties.configuration.softMaxNumDiffs,
  //   );
  //   expect(leafInfo.properties.configuration.channelMonitoringMinutes).toEqual(
  //     leafStar.properties.configuration.channelMonitoringMinutes,
  //   );
  //   expect(leafInfo.properties.configuration.cidMonitoringMinutes).toEqual(
  //     leafStar.properties.configuration.cidMonitoringMinutes,
  //   );
  // });

  // it("can update properties", async () => {
  //   const rootStar = await createStar(
  //     core1,
  //     getConstellationStarType(),
  //     doNothingStarHandler,
  //   );
  //   const leafStar = await createStar(core1, "leaf", doNothingStarHandler);
  //   await rootStar.setData(
  //     JSON.stringify([
  //       {
  //         starId: leafStar.starId,
  //         path: "leaf",
  //       },
  //     ]),
  //   );

  //   // Important: use the same core as for createStar.
  //   // else we won't be allowed to modify the properties.
  //   const constellation = new Constellation(core1, constellationHandler);
  //   await constellation.initialize(rootStar.starId);
  //   await constellation.activate(["leaf"]);

  //   const newProps = {
  //     status: StarStatus.Cold,
  //     admins: ["admin"],
  //     mods: ["mod"],
  //     annotations: "test_annotate_plz",
  //     configuration: {
  //       maxDiffSize: 10201,
  //       softMinSnapshotDuration: 10202,
  //       softMaxDiffDuration: 10203,
  //       softMaxNumDiffs: 10204,
  //       channelMonitoringMinutes: 10205,
  //       cidMonitoringMinutes: 10206,
  //     },
  //   };

  //   expect(onPropertiesChangedArgs.length).toEqual(2);
  //   expect(onPropertiesChangedArgs[0]).toEqual(rootStar.starId);
  //   expect(onPropertiesChangedArgs[1]).toEqual(leafStar.starId);

  //   await constellation.updateProperties(["leaf"], newProps);

  //   expect(onPropertiesChangedArgs.length).toEqual(3);
  //   expect(onPropertiesChangedArgs[2]).toEqual(leafStar.starId);

  //   const info = constellation.info(["leaf"]);
  //   const props = info.properties;

  //   expect(props.admins.length).toEqual(1);
  //   expect(props.admins[0]).toEqual(newProps.admins[0]);
  //   expect(props.mods.length).toEqual(1);
  //   expect(props.mods[0]).toEqual(newProps.mods[0]);
  //   expect(props.annotations).toEqual(newProps.annotations);
  //   expect(props.status).toEqual(newProps.status);
  //   expect(props.configuration.maxDiffSize).toEqual(
  //     newProps.configuration.maxDiffSize,
  //   );
  //   expect(props.configuration.softMinSnapshotDuration).toEqual(
  //     newProps.configuration.softMinSnapshotDuration,
  //   );
  //   expect(props.configuration.softMaxDiffDuration).toEqual(
  //     newProps.configuration.softMaxDiffDuration,
  //   );
  //   expect(props.configuration.softMaxNumDiffs).toEqual(
  //     newProps.configuration.softMaxNumDiffs,
  //   );
  //   expect(props.configuration.channelMonitoringMinutes).toEqual(
  //     newProps.configuration.channelMonitoringMinutes,
  //   );
  //   expect(props.configuration.cidMonitoringMinutes).toEqual(
  //     newProps.configuration.cidMonitoringMinutes,
  //   );
  // });

  // it("can get the data for both constellation type stars and other types", async () => {
  //   const rootStar = await createStar(
  //     core1,
  //     getConstellationStarType(),
  //     doNothingStarHandler,
  //   );
  //   const leafStar = await createStar(core1, "leaf", doNothingStarHandler);
  //   const rootData = JSON.stringify([
  //     {
  //       starId: leafStar.starId,
  //       path: "leaf",
  //     },
  //   ]);
  //   const leafData = "Leafs are nice. Have some plants in your work space.";
  //   await rootStar.setData(rootData);
  //   await leafStar.setData(leafData);

  //   const constellation = new Constellation(core2, constellationHandler);
  //   await constellation.initialize(rootStar.starId);
  //   await constellation.activate(["leaf"]);

  //   const rootReceived = await constellation.getData([]);
  //   const leafReceived = await constellation.getData(["leaf"]);

  //   expect(rootReceived).toEqual(rootData);
  //   expect(leafReceived).toEqual(leafData);
  // });

  // it("can set the data for other types but not constellation type stars", async () => {
  //   const rootStar = await createStar(
  //     core1,
  //     getConstellationStarType(),
  //     doNothingStarHandler,
  //   );
  //   const leafStar = await createStar(core1, "leaf", doNothingStarHandler);
  //   const originalRootData = JSON.stringify([
  //     {
  //       starId: leafStar.starId,
  //       path: "leaf",
  //     },
  //   ]);
  //   const updatedRootData = "This update should be rejected.";
  //   const originalLeafData =
  //     "Leafs are nice. Have some plants in your work space.";
  //   const updatedLeafData = "Have some plants in your home too.";
  //   await rootStar.setData(originalRootData);
  //   await leafStar.setData(originalLeafData);

  //   // Again, same core, else we're not permitted to change anything.
  //   const constellation = new Constellation(core1, constellationHandler);
  //   await constellation.initialize(rootStar.starId);
  //   await constellation.activate(["leaf"]);

  //   expect(onDataChangedArgs.length).toEqual(1);
  //   expect(onDataChangedArgs[0]).toEqual(leafStar.starId);

  //   await constellation.setData([], updatedRootData);
  //   await constellation.setData(["leaf"], updatedLeafData);

  //   expect(onDataChangedArgs.length).toEqual(2);
  //   expect(onDataChangedArgs[1]).toEqual(leafStar.starId);

  //   const rootReceived = await constellation.getData([]);
  //   const leafReceived = await constellation.getData(["leaf"]);

  //   expect(rootReceived).toEqual(originalRootData);
  //   expect(leafReceived).toEqual(updatedLeafData);
  // });

  it("can create a new data star at a path", async () => {
    const rootStar = await createStar(
      core1,
      getConstellationStarType(),
      doNothingStarHandler,
    );

    const constellation = new Constellation(core1, constellationHandler);
    await constellation.initialize(rootStar.starId);

    expect(onPathsUpdatedArgs.length).toEqual(0);

    const path = ["leaf"];
    const type = "leaf_type";
    const owners = [core2.constellationNode.address, core1.constellationNode.address];
    await constellation.createNewFile(path, type, owners);

    expect(onPathsUpdatedArgs.length).toEqual(1);
    expect(onPathsUpdatedArgs[0]).toEqual(rootStar.starId);

    const root = constellation.root;
    expect(root.path).toEqual("");
    expect(root.starId).toEqual(rootStar.starId);
    expect(root.isActive).toBeTruthy();
    expect(root.entries.length).toEqual(1);

    expect(root.entries[0].path).toEqual(path[0]);
    expect(root.entries[0].starId).toBeDefined();
    expect(root.entries[0].isActive).toBeTruthy();
    expect(root.entries[0].entries.length).toEqual(0);

    const leafInfo = constellation.info(path);
    expect(leafInfo.starInfo.type).toEqual(type);
    expect(leafInfo.starInfo.owners.length).toEqual(owners.length);
    for (var i = 0; i < owners.length; i++) {
      expect(leafInfo.starInfo.owners[i]).toEqual(owners[i]);
    }
    expect(leafInfo.properties.status).toEqual(StarStatus.Bright);
  })

});
