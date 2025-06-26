import { beforeEach, describe, expect, it } from "vitest";
import { Logger, NullLogger } from "../src/services/logger";
import { ConstellationNode } from "../src/constellations/constellationNode";
import { Wallet } from "ethers";
import { CryptoService } from "../src/services/cryptoService";
import { Core } from "../src/constellations/core";
import { StarStatus } from "../src/constellations/starProperties";
import { createDefaultNewStarConfiguration } from "../src/constellations/starConfiguration";
import { MockCodexService } from "./mockCodex.js";
import { MockWaku } from "./mockWaku";

describe("TwoStarTest", () => {
  const logger = new NullLogger("TwoStarTest");
  const codexService = new MockCodexService();
  const mockWaku = new MockWaku();

  const doNothingHandler = {
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

    codexService._core = core;

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
  });

  async function createStar(core, type, handler) {
    const owners = [core.constellationNode.address];
    return await core.starFactory.createNewStar(type, owners, handler);
  }

  async function connectStar(core, starId, handler) {
    return await core.starFactory.connectToStar(starId, handler);
  }

  it("transmits starInfo", async () => {
    const type = "test_type_a";

    const star1 = await createStar(core1, type, doNothingHandler);
    const star2 = await connectStar(core2, star1.starId, doNothingHandler);

    expect(star1.starId).toEqual(star2.starId);

    expect(star1.starInfo.type).toEqual(type);
    expect(star2.starInfo.type).toEqual(type);

    expect(star1.starInfo.owners).toEqual([id1]);
    expect(star2.starInfo.owners).toEqual([id1]);

    expect(star1.starInfo.creationUtc).toEqual(star2.starInfo.creationUtc);
  });

  it("transmits initial properties", async () => {
    const properties = {
      admins: [id1],
      mods: [id2],
      status: StarStatus.Bright,
      configuration: {
        maxDiffSize: 21,
        softMinSnapshotDuration: 22,
        softMaxDiffDuration: 23,
        softMaxNumDiffs: 24,
        channelMonitoringMinutes: 25,
        cidMonitoringMinutes: 26,
      },
      annotations: "initial_annotation",
    };

    const star1 = await core1.starFactory.createNewStar(
      "test_type",
      [id1],
      doNothingHandler,
      new Date(),
      properties,
    );
    const star2 = await connectStar(core2, star1.starId, doNothingHandler);

    expect(star1.properties.admins).toEqual([id1]);
    expect(star2.properties.admins).toEqual([id1]);

    expect(star1.properties.mods).toEqual([id2]);
    expect(star2.properties.mods).toEqual([id2]);

    expect(star1.properties.status).toEqual(StarStatus.Bright);
    expect(star2.properties.status).toEqual(StarStatus.Bright);

    expect(star1.properties.annotations).toEqual(properties.annotations);
    expect(star2.properties.annotations).toEqual(properties.annotations);

    expect(star1.properties.configuration.maxDiffSize).toEqual(
      properties.configuration.maxDiffSize,
    );
    expect(star2.properties.configuration.maxDiffSize).toEqual(
      properties.configuration.maxDiffSize,
    );

    expect(star1.properties.configuration.softMinSnapshotDuration).toEqual(
      properties.configuration.softMinSnapshotDuration,
    );
    expect(star2.properties.configuration.softMinSnapshotDuration).toEqual(
      properties.configuration.softMinSnapshotDuration,
    );

    expect(star1.properties.configuration.softMaxDiffDuration).toEqual(
      properties.configuration.softMaxDiffDuration,
    );
    expect(star2.properties.configuration.softMaxDiffDuration).toEqual(
      properties.configuration.softMaxDiffDuration,
    );

    expect(star1.properties.configuration.softMaxNumDiffs).toEqual(
      properties.configuration.softMaxNumDiffs,
    );
    expect(star2.properties.configuration.softMaxNumDiffs).toEqual(
      properties.configuration.softMaxNumDiffs,
    );

    expect(star1.properties.configuration.channelMonitoringMinutes).toEqual(
      properties.configuration.channelMonitoringMinutes,
    );
    expect(star2.properties.configuration.channelMonitoringMinutes).toEqual(
      properties.configuration.channelMonitoringMinutes,
    );

    expect(star1.properties.configuration.cidMonitoringMinutes).toEqual(
      properties.configuration.cidMonitoringMinutes,
    );
    expect(star2.properties.configuration.cidMonitoringMinutes).toEqual(
      properties.configuration.cidMonitoringMinutes,
    );
  });

  describe("transmiting property updates", () => {
    var star1 = {};
    var star2 = {};
    var propertiesChangedArgs = [];

    const watchPropertiesHandler = {
      onDataChanged: async (star) => {},
      onPropertiesChanged: async (star) => {
        propertiesChangedArgs.push(star);
      },
    };

    function assertPropertyChangedRaised() {
      expect(propertiesChangedArgs.length).toBe(2);
      expect(propertiesChangedArgs.includes(star1));
      expect(propertiesChangedArgs.includes(star2));
      propertiesChangedArgs = [];
    }

    beforeEach(async () => {
      propertiesChangedArgs = [];
      star1 = await createStar(core1, "test_type", watchPropertiesHandler);
      star2 = await connectStar(core2, star1.starId, watchPropertiesHandler);
      assertPropertyChangedRaised();
    });

    it("updates admins", async () => {
      expect(star1.properties.admins).toEqual([]);
      expect(star2.properties.admins).toEqual([]);

      star1.properties.admins = [id2];
      await star1.properties.commitChanges();
      await mockWaku.deliverAll();

      expect(star1.properties.admins).toEqual([id2]);
      expect(star2.properties.admins).toEqual([id2]);
      assertPropertyChangedRaised();
    });

    it("updates mods", async () => {
      expect(star1.properties.mods).toEqual([]);
      expect(star2.properties.mods).toEqual([]);

      star1.properties.mods = [id2];
      await star1.properties.commitChanges();
      await mockWaku.deliverAll();

      expect(star1.properties.mods).toEqual([id2]);
      expect(star2.properties.mods).toEqual([id2]);
      assertPropertyChangedRaised();
    });

    it("updates status", async () => {
      expect(star1.properties.status).toBe(StarStatus.Bright);
      expect(star2.properties.status).toBe(StarStatus.Bright);

      star1.properties.status = StarStatus.Cold;
      await star1.properties.commitChanges();
      await mockWaku.deliverAll();

      expect(star1.properties.status).toBe(StarStatus.Cold);
      expect(star2.properties.status).toBe(StarStatus.Cold);
      assertPropertyChangedRaised();
    });

    it("updates annotations", async () => {
      const defaultAnnotation = "new_star";
      const updatedAnnotation = "updated_annnotation";

      expect(star1.properties.annotations).toBe(defaultAnnotation);
      expect(star2.properties.annotations).toBe(defaultAnnotation);

      star1.properties.annotations = updatedAnnotation;
      await star1.properties.commitChanges();
      await mockWaku.deliverAll();

      expect(star1.properties.annotations).toBe(updatedAnnotation);
      expect(star2.properties.annotations).toBe(updatedAnnotation);
      assertPropertyChangedRaised();
    });

    describe("configuration updates", () => {
      const defaultValues = createDefaultNewStarConfiguration();

      it("updates maxDiffSize", async () => {
        const newValue = 33;
        expect(star1.properties.configuration.maxDiffSize).toBe(
          defaultValues.maxDiffSize,
        );
        expect(star2.properties.configuration.maxDiffSize).toBe(
          defaultValues.maxDiffSize,
        );

        star1.properties.configuration.maxDiffSize = newValue;
        await star1.properties.commitChanges();
        await mockWaku.deliverAll();

        expect(star1.properties.configuration.maxDiffSize).toBe(newValue);
        expect(star2.properties.configuration.maxDiffSize).toBe(newValue);
        assertPropertyChangedRaised();
      });

      it("updates softMinSnapshotDuration", async () => {
        const newValue = 33;
        expect(star1.properties.configuration.softMinSnapshotDuration).toBe(
          defaultValues.softMinSnapshotDuration,
        );
        expect(star2.properties.configuration.softMinSnapshotDuration).toBe(
          defaultValues.softMinSnapshotDuration,
        );
        star1.properties.configuration.softMinSnapshotDuration = newValue;
        await star1.properties.commitChanges();
        await mockWaku.deliverAll();
        expect(star1.properties.configuration.softMinSnapshotDuration).toBe(
          newValue,
        );
        expect(star2.properties.configuration.softMinSnapshotDuration).toBe(
          newValue,
        );
        assertPropertyChangedRaised();
      });

      it("updates softMaxDiffDuration", async () => {
        const newValue = 33;
        expect(star1.properties.configuration.softMaxDiffDuration).toBe(
          defaultValues.softMaxDiffDuration,
        );
        expect(star2.properties.configuration.softMaxDiffDuration).toBe(
          defaultValues.softMaxDiffDuration,
        );
        star1.properties.configuration.softMaxDiffDuration = newValue;
        await star1.properties.commitChanges();
        await mockWaku.deliverAll();
        expect(star1.properties.configuration.softMaxDiffDuration).toBe(
          newValue,
        );
        expect(star2.properties.configuration.softMaxDiffDuration).toBe(
          newValue,
        );
        assertPropertyChangedRaised();
      });

      it("updates softMaxNumDiffs", async () => {
        const newValue = 33;
        expect(star1.properties.configuration.softMaxNumDiffs).toBe(
          defaultValues.softMaxNumDiffs,
        );
        expect(star2.properties.configuration.softMaxNumDiffs).toBe(
          defaultValues.softMaxNumDiffs,
        );
        star1.properties.configuration.softMaxNumDiffs = newValue;
        await star1.properties.commitChanges();
        await mockWaku.deliverAll();
        expect(star1.properties.configuration.softMaxNumDiffs).toBe(newValue);
        expect(star2.properties.configuration.softMaxNumDiffs).toBe(newValue);
        assertPropertyChangedRaised();
      });

      it("updates channelMonitoringMinutes", async () => {
        const newValue = 33;
        expect(star1.properties.configuration.channelMonitoringMinutes).toBe(
          defaultValues.channelMonitoringMinutes,
        );
        expect(star2.properties.configuration.channelMonitoringMinutes).toBe(
          defaultValues.channelMonitoringMinutes,
        );
        star1.properties.configuration.channelMonitoringMinutes = newValue;
        await star1.properties.commitChanges();
        await mockWaku.deliverAll();
        expect(star1.properties.configuration.channelMonitoringMinutes).toBe(
          newValue,
        );
        expect(star2.properties.configuration.channelMonitoringMinutes).toBe(
          newValue,
        );
        assertPropertyChangedRaised();
      });

      it("updates cidMonitoringMinutes", async () => {
        const newValue = 33;
        expect(star1.properties.configuration.cidMonitoringMinutes).toBe(
          defaultValues.cidMonitoringMinutes,
        );
        expect(star2.properties.configuration.cidMonitoringMinutes).toBe(
          defaultValues.cidMonitoringMinutes,
        );
        star1.properties.configuration.cidMonitoringMinutes = newValue;
        await star1.properties.commitChanges();
        await mockWaku.deliverAll();
        expect(star1.properties.configuration.cidMonitoringMinutes).toBe(
          newValue,
        );
        expect(star2.properties.configuration.cidMonitoringMinutes).toBe(
          newValue,
        );
        assertPropertyChangedRaised();
      });
    });
  });

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

  it("transmits data", async () => {
    const pastData = "pastData";
    const presentData = "presentData";
    const futureData = "futureData";

    const star1 = await createStar(core1, "test_star", doNothingHandler);
    const starId = star1.starId;

    // Set past and present data before second node connects.
    await star1.setData(pastData);
    await mockWaku.deliverAll();
    expect(star1.size).toEqual(pastData.length);
    assertDatesWithin(star1.lastChangeUtc, new Date(), 101);

    await star1.setData(presentData);
    await mockWaku.deliverAll();
    const presentDataUtc = new Date();
    expect(star1.size).toEqual(presentData.length);
    assertDatesWithin(star1.lastChangeUtc, presentDataUtc, 102);

    var receivedData = [];
    var receivedSizes = [];
    var receivedUtcs = [];
    const receiveHandler = {
      onDataChanged: async (star) => {
        receivedData.push(await star.getData());
        receivedSizes.push(star.size);
        receivedUtcs.push(star.lastChangeUtc);
      },
      onPropertiesChanged: async (star) => {},
    };
    const star2 = await connectStar(core2, starId, receiveHandler);
    await mockWaku.deliverAll();

    // Set future data.
    const futureDataUtc = new Date();
    await star1.setData(futureData);
    await mockWaku.deliverAll();
    assertDatesWithin(star1.lastChangeUtc, futureDataUtc, 103);

    // star2 has received present and future data.
    expect(receivedData).toEqual([presentData, futureData]);
    expect(receivedSizes).toEqual([presentData.length, futureData.length]);
    expect(receivedUtcs.length).toEqual(2);
    assertDatesWithin(presentDataUtc, receivedUtcs[0], 104);
    assertDatesWithin(futureDataUtc, receivedUtcs[1], 105);
  });
});
