import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Logger, NullLogger } from "../src/services/logger";
import { ConstellationNode } from "../src/constellations/constellationNode";
import { Wallet } from "ethers";
import { CryptoService } from "../src/services/cryptoService";
import { Core } from "../src/constellations/core";
import { Constellation } from "../src/constellations/constellation";
import { getConstellationStarType } from "../src/constellations/protocol";
import { StarStatus } from "../src/constellations/starProperties";
import { MockCodexService } from "./mockCodex";
import { MockWaku } from "./mockWaku";

const millisecondsPerMinute = 1000 * 60;

class EventHandler {
  constructor() {
    this.onPathsUpdatedArgs = [];
    this.onPropertiesChangedArgs = [];
    this.onDataChangedArgs = [];
  }
  onPathsUpdated = async (starId) => {
    this.onPathsUpdatedArgs.push(starId);
  };
  onPropertiesChanged = async (starId) => {
    this.onPropertiesChangedArgs.push(starId);
  };
  onDataChanged = async (starId) => {
    this.onDataChangedArgs.push(starId);
  };
}

describe(
  "ConstellationTest",
  {
    timeout: 1 * millisecondsPerMinute,
  },
  () => {
    const logger = new NullLogger("ConstellationTest");

    const doNothingStarHandler = {
      onDataChanged: async (star) => {},
      onPropertiesChanged: async (star) => {},
    };

    function createCore(name) {
      const myLogger = logger.prefix(name);
      const wallet = Wallet.createRandom();
      const constellationNode = new ConstellationNode(wallet);
      const cryptoService = new CryptoService(constellationNode);

      const core = new Core(
        myLogger,
        constellationNode,
        mockWaku.createMockWakuServiceForAddress(constellationNode.address),
        codexService,
        cryptoService,
      );

      return core;
    }

    var eventHandler = null;
    var mockWaku = null;
    var codexService = null;
    var core1 = null;
    var core2 = null;
    var constellation = null;

    beforeEach(() => {
      mockWaku = new MockWaku();
      codexService = new MockCodexService();
      core1 = createCore("One");
      core2 = createCore("Two");
      eventHandler = new EventHandler();
    });

    afterEach(async () => {
      if (constellation) {
        await constellation.disconnect();
      }
      await mockWaku.stopAll();
    });

    async function createStar(name, core, type, handler) {
      const owners = [core.constellationNode.address];
      const star = await core.starFactory.createNewStar(type, owners, handler);
      logger.addReplacement(star.starId, name);
      return star;
    }

    function assertDatesWithin(date1, date2, tolerance) {
      date1 = new Date(date1);
      date2 = new Date(date2);
      const delta = Math.abs(date1.getTime() - date2.getTime());
      if (delta > tolerance) {
        throw new Error(
          `Dates not within tolerance: was: ${delta} limit: ${tolerance}\n - date1: ${date1}\n - date2: ${date2}`,
        );
      }
    }

    it("can initialize an empty constellation", async () => {
      const rootStar = await createStar(
        "root",
        core1,
        getConstellationStarType(),
        doNothingStarHandler,
      );

      await rootStar.setData(JSON.stringify([]));
      await mockWaku.deliverAll();

      constellation = new Constellation(core2, eventHandler);
      await constellation.initialize(rootStar.starId);
      await mockWaku.deliverAll();

      expect(eventHandler.onPathsUpdatedArgs.length).toEqual(0);

      const root = constellation.root;
      expect(root.path).toEqual("");
      expect(root.starId).toEqual(rootStar.starId);
      expect(root.isActive).toBeTruthy();
      expect(root.entries.length).toEqual(0);
    });

    it("can initialize a simple constellation", async () => {
      const rootStar = await createStar(
        "root",
        core1,
        getConstellationStarType(),
        doNothingStarHandler,
      );
      const leaf1 = await createStar(
        "leaf1",
        core1,
        "leaf_1",
        doNothingStarHandler,
      );
      const leaf2 = await createStar(
        "leaf2",
        core1,
        "leaf_2",
        doNothingStarHandler,
      );

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
      await mockWaku.deliverAll();

      constellation = new Constellation(core2, eventHandler);
      await constellation.initialize(rootStar.starId);
      await mockWaku.deliverAll();

      expect(eventHandler.onPathsUpdatedArgs.length).toEqual(1);
      expect(eventHandler.onPathsUpdatedArgs[0]).toEqual(rootStar.starId);

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
        "root",
        core1,
        getConstellationStarType(),
        doNothingStarHandler,
      );
      const folder = await createStar(
        "folder",
        core1,
        getConstellationStarType(),
        doNothingStarHandler,
      );
      const leaf = await createStar(
        "leaf",
        core1,
        "leaf",
        doNothingStarHandler,
      );

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
      await mockWaku.deliverAll();

      constellation = new Constellation(core2, eventHandler);
      await constellation.initialize(rootStar.starId);
      await mockWaku.deliverAll();
      expect(eventHandler.onPathsUpdatedArgs.length).toEqual(1);
      expect(eventHandler.onPathsUpdatedArgs[0]).toEqual(rootStar.starId);

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
      await mockWaku.deliverAll();
      expect(eventHandler.onPathsUpdatedArgs.length).toEqual(2);
      expect(eventHandler.onPathsUpdatedArgs[1]).toEqual(folder.starId);

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
        "root",
        core1,
        getConstellationStarType(),
        doNothingStarHandler,
      );
      const folder = await createStar(
        "folder",
        core1,
        getConstellationStarType(),
        doNothingStarHandler,
      );
      const leaf = await createStar(
        "leaf",
        core1,
        "leaf",
        doNothingStarHandler,
      );

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
      await mockWaku.deliverAll();

      constellation = new Constellation(core2, eventHandler);
      await constellation.initialize(rootStar.starId);
      await mockWaku.deliverAll();
      expect(eventHandler.onPathsUpdatedArgs.length).toEqual(1);
      expect(eventHandler.onPathsUpdatedArgs[0]).toEqual(rootStar.starId);

      var root = constellation.root;
      // when we activate the folder, we expect another update event.
      // after that, we expect the leaf to be visible.
      await constellation.activate(["folder"]);
      await mockWaku.deliverAll();
      expect(eventHandler.onPathsUpdatedArgs.length).toEqual(2);
      expect(eventHandler.onPathsUpdatedArgs[1]).toEqual(folder.starId);

      root = constellation.root;
      expect(root.entries.length).toEqual(1); // root
      expect(root.entries[0].isActive).toBeTruthy();
      expect(root.entries[0].entries.length).toEqual(1); // folder
      expect(root.entries[0].entries[0].entries.length).toEqual(0); // leaf

      // We deactivate the folder, expecting another update event
      // and expecting the leaf to disappear from view.
      await constellation.deactivate(["folder"]);
      await mockWaku.deliverAll();

      expect(eventHandler.onPathsUpdatedArgs.length).toEqual(3);
      expect(eventHandler.onPathsUpdatedArgs[1]).toEqual(folder.starId);

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
        "root",
        core1,
        getConstellationStarType(),
        doNothingStarHandler,
      );
      const leafStar = await createStar(
        "leaf",
        core1,
        "leaf",
        doNothingStarHandler,
      );
      await rootStar.setData(
        JSON.stringify([
          {
            starId: leafStar.starId,
            path: "leaf",
          },
        ]),
      );
      await mockWaku.deliverAll();

      constellation = new Constellation(core2, eventHandler);
      await constellation.initialize(rootStar.starId);
      await mockWaku.deliverAll();
      expect(eventHandler.onPathsUpdatedArgs.length).toEqual(1);

      const rootInfo = constellation.info([]);
      expect(rootInfo.starId).toEqual(rootStar.starId);
      expect(rootInfo.path.length).toEqual(0);
      expect(rootInfo.starInfo.type).toEqual(getConstellationStarType());
      expect(rootInfo.starInfo).toStrictEqual(rootStar.starInfo);
      expect(rootInfo.health).toStrictEqual(rootStar.health);
      expect(rootInfo.size).toEqual(rootStar.size);
      assertDatesWithin(rootInfo.lastChangeUtc, rootStar.lastChangeUtc, 100);
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
      expect(
        rootInfo.properties.configuration.channelMonitoringMinutes,
      ).toEqual(rootStar.properties.configuration.channelMonitoringMinutes);
      expect(rootInfo.properties.configuration.cidMonitoringMinutes).toEqual(
        rootStar.properties.configuration.cidMonitoringMinutes,
      );

      await constellation.activate(["leaf"]);
      await mockWaku.deliverAll();

      const leafInfo = constellation.info(["leaf"]);
      expect(leafInfo.starId).toEqual(leafStar.starId);
      expect(leafInfo.path.length).toEqual(1);
      expect(leafInfo.path[0]).toEqual("leaf");
      expect(leafInfo.starInfo.type).toEqual("leaf");
      expect(leafInfo.starInfo).toStrictEqual(leafStar.starInfo);
      expect(leafInfo.health).toStrictEqual(leafStar.health);
      expect(leafInfo.size).toEqual(leafStar.size);
      expect(leafInfo.lastChangeUtc).toEqual(leafStar.lastChangeUtc);
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
      expect(
        leafInfo.properties.configuration.channelMonitoringMinutes,
      ).toEqual(leafStar.properties.configuration.channelMonitoringMinutes);
      expect(leafInfo.properties.configuration.cidMonitoringMinutes).toEqual(
        leafStar.properties.configuration.cidMonitoringMinutes,
      );
    });

    it("can update properties", async () => {
      const rootStar = await createStar(
        "root",
        core1,
        getConstellationStarType(),
        doNothingStarHandler,
      );
      const leafStar = await createStar(
        "leaf",
        core1,
        "leaf",
        doNothingStarHandler,
      );
      await rootStar.setData(
        JSON.stringify([
          {
            starId: leafStar.starId,
            path: "leaf",
          },
        ]),
      );
      await mockWaku.deliverAll();

      // Important: use the same core as for createStar.
      // else we won't be allowed to modify the properties.
      constellation = new Constellation(core1, eventHandler);
      await constellation.initialize(rootStar.starId);
      await constellation.activate(["leaf"]);
      await mockWaku.deliverAll();

      const newProps = {
        status: StarStatus.Cold,
        admins: ["admin"],
        mods: ["mod"],
        annotations: "test_annotate_plz",
        configuration: {
          maxDiffSize: 10201,
          softMinSnapshotDuration: 10202,
          softMaxDiffDuration: 10203,
          softMaxNumDiffs: 10204,
          channelMonitoringMinutes: 10205,
          cidMonitoringMinutes: 10206,
        },
      };

      expect(eventHandler.onPropertiesChangedArgs.length).toEqual(2);
      expect(eventHandler.onPropertiesChangedArgs[0]).toEqual(rootStar.starId);
      expect(eventHandler.onPropertiesChangedArgs[1]).toEqual(leafStar.starId);

      await constellation.updateProperties(["leaf"], newProps);
      await mockWaku.deliverAll();

      expect(eventHandler.onPropertiesChangedArgs.length).toEqual(3);
      expect(eventHandler.onPropertiesChangedArgs[2]).toEqual(leafStar.starId);

      const info = constellation.info(["leaf"]);
      const props = info.properties;

      expect(props.admins.length).toEqual(1);
      expect(props.admins[0]).toEqual(newProps.admins[0]);
      expect(props.mods.length).toEqual(1);
      expect(props.mods[0]).toEqual(newProps.mods[0]);
      expect(props.annotations).toEqual(newProps.annotations);
      expect(props.status).toEqual(newProps.status);
      expect(props.configuration.maxDiffSize).toEqual(
        newProps.configuration.maxDiffSize,
      );
      expect(props.configuration.softMinSnapshotDuration).toEqual(
        newProps.configuration.softMinSnapshotDuration,
      );
      expect(props.configuration.softMaxDiffDuration).toEqual(
        newProps.configuration.softMaxDiffDuration,
      );
      expect(props.configuration.softMaxNumDiffs).toEqual(
        newProps.configuration.softMaxNumDiffs,
      );
      expect(props.configuration.channelMonitoringMinutes).toEqual(
        newProps.configuration.channelMonitoringMinutes,
      );
      expect(props.configuration.cidMonitoringMinutes).toEqual(
        newProps.configuration.cidMonitoringMinutes,
      );
    });

    it("can get the data for both constellation type stars and other types", async () => {
      const rootStar = await createStar(
        "root",
        core1,
        getConstellationStarType(),
        doNothingStarHandler,
      );
      const leafStar = await createStar(
        "leaf",
        core1,
        "leaf",
        doNothingStarHandler,
      );
      const rootData = JSON.stringify([
        {
          starId: leafStar.starId,
          path: "leaf",
        },
      ]);
      const leafData = "Leafs are nice. Have some plants in your work space.";
      await rootStar.setData(rootData);
      await leafStar.setData(leafData);
      await mockWaku.deliverAll();

      constellation = new Constellation(core2, eventHandler);
      await constellation.initialize(rootStar.starId);
      await constellation.activate(["leaf"]);
      await mockWaku.deliverAll();

      const rootReceived = await constellation.getData([]);
      const leafReceived = await constellation.getData(["leaf"]);

      expect(rootReceived).toEqual(rootData);
      expect(leafReceived).toEqual(leafData);
    });

    it("can set the data for other types but not constellation type stars", async () => {
      const rootStar = await createStar(
        "root",
        core1,
        getConstellationStarType(),
        doNothingStarHandler,
      );
      const leafStar = await createStar(
        "leaf",
        core1,
        "leaf",
        doNothingStarHandler,
      );
      const originalRootData = JSON.stringify([
        {
          starId: leafStar.starId,
          path: "leaf",
        },
      ]);
      const updatedRootData = "This update should be rejected.";
      const originalLeafData =
        "Leafs are nice. Have some plants in your work space.";
      const updatedLeafData = "Have some plants in your home too.";
      await rootStar.setData(originalRootData);
      await leafStar.setData(originalLeafData);
      await mockWaku.deliverAll();

      // Again, same core, else we're not permitted to change anything.
      constellation = new Constellation(core1, eventHandler);
      await constellation.initialize(rootStar.starId);
      await constellation.activate(["leaf"]);
      await mockWaku.deliverAll();

      expect(eventHandler.onDataChangedArgs.length).toEqual(1);
      expect(eventHandler.onDataChangedArgs[0]).toEqual(leafStar.starId);

      await constellation.setData([], updatedRootData);
      await constellation.setData(["leaf"], updatedLeafData);
      await mockWaku.deliverAll();

      expect(eventHandler.onDataChangedArgs.length).toEqual(2);
      expect(eventHandler.onDataChangedArgs[1]).toEqual(leafStar.starId);

      const rootReceived = await constellation.getData([]);
      const leafReceived = await constellation.getData(["leaf"]);

      expect(rootReceived).toEqual(originalRootData);
      expect(leafReceived).toEqual(updatedLeafData);
    });

    it("can create a new data star at a path", async () => {
      const rootStar = await createStar(
        "root",
        core1,
        getConstellationStarType(),
        doNothingStarHandler,
      );
      await mockWaku.deliverAll();

      constellation = new Constellation(core1, eventHandler);
      await constellation.initialize(rootStar.starId);
      await mockWaku.deliverAll();

      expect(eventHandler.onPathsUpdatedArgs.length).toEqual(0);

      const path = ["leaf"];
      const type = "leaf_type";
      const owners = [
        core2.constellationNode.address,
        core1.constellationNode.address,
      ];
      const newStarId = await constellation.createNewFile(path, type, owners);
      await mockWaku.deliverAll();

      expect(eventHandler.onPathsUpdatedArgs.length).toEqual(1);
      expect(eventHandler.onPathsUpdatedArgs[0]).toEqual(rootStar.starId);

      const root = constellation.root;
      expect(root.path).toEqual("");
      expect(root.starId).toEqual(rootStar.starId);
      expect(root.isActive).toBeTruthy();
      expect(root.entries.length).toEqual(1);

      expect(root.entries[0].path).toEqual(path[0]);
      expect(root.entries[0].starId).toEqual(newStarId);
      expect(root.entries[0].isActive).toBeTruthy();
      expect(root.entries[0].entries.length).toEqual(0);

      const leafInfo = constellation.info(path);
      expect(leafInfo.starInfo.type).toEqual(type);
      expect(leafInfo.starInfo.owners.length).toEqual(owners.length);
      for (var i = 0; i < owners.length; i++) {
        expect(leafInfo.starInfo.owners[i]).toEqual(owners[i]);
      }
      expect(leafInfo.properties.status).toEqual(StarStatus.Bright);
    });

    it("can create a new folder star at a path", async () => {
      const rootStar = await createStar(
        "root",
        core1,
        getConstellationStarType(),
        doNothingStarHandler,
      );
      await mockWaku.deliverAll();

      constellation = new Constellation(core1, eventHandler);
      await constellation.initialize(rootStar.starId);
      await mockWaku.deliverAll();

      expect(eventHandler.onPathsUpdatedArgs.length).toEqual(0);

      const path = ["folder"];
      const owners = [
        core2.constellationNode.address,
        core1.constellationNode.address,
      ];
      const newStarId = await constellation.createNewFolder(path, owners);
      await mockWaku.deliverAll();

      expect(eventHandler.onPathsUpdatedArgs.length).toEqual(1);
      expect(eventHandler.onPathsUpdatedArgs[0]).toEqual(rootStar.starId);

      const root = constellation.root;
      expect(root.path).toEqual("");
      expect(root.starId).toEqual(rootStar.starId);
      expect(root.isActive).toBeTruthy();
      expect(root.entries.length).toEqual(1);

      expect(root.entries[0].path).toEqual(path[0]);
      expect(root.entries[0].starId).toEqual(newStarId);
      expect(root.entries[0].isActive).toBeTruthy();
      expect(root.entries[0].entries.length).toEqual(0);

      const folderInfo = constellation.info(path);
      expect(folderInfo.starInfo.type).toEqual(getConstellationStarType());
      expect(folderInfo.starInfo.owners.length).toEqual(owners.length);
      for (var i = 0; i < owners.length; i++) {
        expect(folderInfo.starInfo.owners[i]).toEqual(owners[i]);
      }
      expect(folderInfo.properties.status).toEqual(StarStatus.Bright);
    });

    it("can create a new folder star and nest a new data star", async () => {
      const rootStar = await createStar(
        "root",
        core1,
        getConstellationStarType(),
        doNothingStarHandler,
      );
      await mockWaku.deliverAll();

      constellation = new Constellation(core1, eventHandler);
      await constellation.initialize(rootStar.starId);
      await mockWaku.deliverAll();

      expect(eventHandler.onPathsUpdatedArgs.length).toEqual(0);

      const folderPath = ["folder"];
      const owners = [
        core2.constellationNode.address,
        core1.constellationNode.address,
      ];
      const newFolderStarId = await constellation.createNewFolder(
        folderPath,
        owners,
      );
      await mockWaku.deliverAll();

      expect(eventHandler.onPathsUpdatedArgs.length).toEqual(1);
      expect(eventHandler.onPathsUpdatedArgs[0]).toEqual(rootStar.starId);

      const leafPath = ["folder", "leaf"];
      const leafType = "test_leaf_type";
      const newLeafStarId = await constellation.createNewFile(
        leafPath,
        leafType,
        owners,
      );
      await mockWaku.deliverAll();

      const root = constellation.root;
      expect(root.path).toEqual("");
      expect(root.starId).toEqual(rootStar.starId);
      expect(root.isActive).toBeTruthy();
      expect(root.entries.length).toEqual(1);

      expect(root.entries[0].path).toEqual(folderPath[0]);
      expect(root.entries[0].starId).toEqual(newFolderStarId);
      expect(root.entries[0].isActive).toBeTruthy();
      expect(root.entries[0].entries.length).toEqual(1);

      expect(root.entries[0].entries[0].path).toEqual(leafPath[1]);
      expect(root.entries[0].entries[0].starId).toEqual(newLeafStarId);
      expect(root.entries[0].entries[0].isActive).toBeTruthy();
      expect(root.entries[0].entries[0].entries.length).toEqual(0);
    });

    it("can delete an active star", async () => {
      const rootStar = await createStar(
        "root",
        core1,
        getConstellationStarType(),
        doNothingStarHandler,
      );
      const folder = await createStar(
        "folder",
        core1,
        getConstellationStarType(),
        doNothingStarHandler,
      );
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
            starId: "unknown",
            path: "unknown",
          },
        ]),
      );
      await mockWaku.deliverAll();

      expect(rootStar.properties.status).toEqual(StarStatus.Bright);
      expect(folder.properties.status).toEqual(StarStatus.Bright);

      constellation = new Constellation(core1, eventHandler);
      await constellation.initialize(rootStar.starId);
      await constellation.activate(["folder"]);
      await mockWaku.deliverAll();
      expect(eventHandler.onPathsUpdatedArgs.length).toEqual(2);
      expect(eventHandler.onPathsUpdatedArgs[0]).toEqual(rootStar.starId);
      expect(eventHandler.onPathsUpdatedArgs[1]).toEqual(folder.starId);

      expect(eventHandler.onPropertiesChangedArgs.length).toEqual(2);
      expect(eventHandler.onPropertiesChangedArgs[0]).toEqual(rootStar.starId);
      expect(eventHandler.onPropertiesChangedArgs[1]).toEqual(folder.starId);

      await constellation.delete(["folder"], true);
      await mockWaku.deliverAll();

      expect(eventHandler.onPathsUpdatedArgs.length).toEqual(3);
      expect(eventHandler.onPathsUpdatedArgs[0]).toEqual(rootStar.starId);
      expect(eventHandler.onPathsUpdatedArgs[1]).toEqual(folder.starId);
      expect(eventHandler.onPathsUpdatedArgs[2]).toEqual(rootStar.starId);

      expect(eventHandler.onPropertiesChangedArgs.length).toEqual(2);

      const root = constellation.root;
      expect(root.path).toEqual("");
      expect(root.starId).toEqual(rootStar.starId);
      expect(root.isActive).toBeTruthy();
      expect(root.entries.length).toEqual(0);

      expect(folder.properties.status).toEqual(StarStatus.Cold);
    });
  },
);
