import { beforeEach, describe, expect, it } from "vitest";
import { Logger } from "../src/services/logger";
import { ConstellationNode } from "../src/constellations/constellationNode";
import { Wallet } from "ethers";
import { CryptoService } from "../src/services/cryptoService";
import { Core } from "../src/constellations/core";
import { MockCodexService, MockWakuService } from "./mocks";
import { StarStatus } from "../src/constellations/starProperties";

describe("TwoStarTest", () => {
  const logger = new Logger("TwoStarTest");
  const codexService = new MockCodexService();
  const wakuService = new MockWakuService();

  const doNothingHandler = {
    onDataChanged: async (star) => {},
  };

  function createCore(name) {
    const myLogger = logger.prefix(name);
    const wallet = Wallet.createRandom();
    const constellationNode = new ConstellationNode(wallet);
    const cryptoService = new CryptoService(constellationNode);

    const core = new Core(
      myLogger,
      constellationNode,
      wakuService,
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
      configuration: {}, // todo
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
  });

  describe("transmiting property updates", async () => {
    var star1 = {};
    var star2 = {};

    beforeEach(async () => {
      star1 = await createStar(core1, "test_type", doNothingHandler);
      star2 = await connectStar(core2, star1.starId, doNothingHandler);
    });

    it("updates admins", async () => {
      expect(star1.properties.admins).toEqual([]);
      expect(star2.properties.admins).toEqual([]);

      star1.properties.admins = [id2];
      await star1.properties.commitChanges();

      expect(star1.properties.admins).toEqual([id2]);
      expect(star2.properties.admins).toEqual([id2]);
    });

    it("updates mods", async () => {
      expect(star1.properties.mods).toEqual([]);
      expect(star2.properties.mods).toEqual([]);

      star1.properties.mods = [id2];
      await star1.properties.commitChanges();

      expect(star1.properties.mods).toEqual([id2]);
      expect(star2.properties.mods).toEqual([id2]);
    });

    it("updates status", async () => {
      expect(star1.properties.status).toBe(StarStatus.Bright);
      expect(star2.properties.status).toBe(StarStatus.Bright);

      star1.properties.status = StarStatus.Cold;
      await star1.properties.commitChanges();

      expect(star1.properties.status).toBe(StarStatus.Cold);
      expect(star2.properties.status).toBe(StarStatus.Cold);
    });

    it("updates annotations", async () => {
      const defaultAnnotation = "new_star";
      const updatedAnnotation = "updated_annnotation";

      expect(star1.properties.annotations).toBe(defaultAnnotation);
      expect(star2.properties.annotations).toBe(defaultAnnotation);

      star1.properties.annotations = updatedAnnotation;
      await star1.properties.commitChanges();

      expect(star1.properties.annotations).toBe(updatedAnnotation);
      expect(star2.properties.annotations).toBe(updatedAnnotation);
    });
  });

  it("transmits data", async () => {
    const pastData = "pastData";
    const presentData = "presentData";
    const futureData = "futureData";

    const star1 = await createStar(core1, "test_star", doNothingHandler);
    const starId = star1.starId;

    // Set past and present data before second node connects.
    await star1.setData(pastData);
    await star1.setData(presentData);

    var receivedData = [];
    const receiveHandler = {
      onDataChanged: async (star) => {
        receivedData.push(await star.getData());
      },
    };
    const star2 = await connectStar(core2, starId, receiveHandler);

    // Set future data.
    await star1.setData(futureData);

    // star2 has received present and future data.
    expect(receivedData).toEqual([presentData, futureData]);
  });
});
