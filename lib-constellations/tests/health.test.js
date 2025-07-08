import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NullLogger } from "../src/services/logger";
import { ConstellationNode } from "../src/constellations/constellationNode";
import { Wallet } from "ethers";
import { CryptoService } from "../src/services/cryptoService";
import { Core } from "../src/constellations/core";
import { StarStatus } from "../src/constellations/starProperties";
import { MockCodexService } from "./mockCodex";
import { MockWaku } from "./mockWaku";

const testHealthUpdateInterval = 500;
const millisecondsPerMinute = 1000 * 60;

describe(
  "HealthTests",
  {
    timeout: 1 * millisecondsPerMinute,
  },
  () => {
    // Replace this NullLogger with normal Logger to get output.
    const logger = new NullLogger("HealthTests");
    var codexService = null;
    var mockWaku = null;

    const doNothingHandler = {
      onDataChanged: async (star) => {},
      onPropertiesChanged: async (star) => {},
    };

    beforeEach(() => {
      codexService = new MockCodexService();
      mockWaku = new MockWaku();
    });

    afterEach(async () => {
      await mockWaku.stopAll();
    });

    function createCore(name) {
      const myLogger = logger.prefix(name);
      myLogger.filename = `healthtest_${name}.log`;
      const wallet = Wallet.createRandom();
      const constellationNode = new ConstellationNode(wallet);
      const cryptoService = new CryptoService(constellationNode);

      myLogger.addReplacement(constellationNode.address, `<${name}>`);

      const core = new Core(
        myLogger,
        constellationNode,
        mockWaku.createMockWakuServiceForAddress(constellationNode.address),
        codexService,
        cryptoService,
      );

      return core;
    }

    async function createStar(name) {
      const core = createCore(name);
      const owners = [core.constellationNode.address];
      var properties = {
        admins: [],
        mods: [],
        status: StarStatus.Bright,
        configuration: {
          maxDiffSize: 0,
          softMinSnapshotDuration: 0,
          softMaxDiffDuration: 0,
          softMaxNumDiffs: 0,
          channelMonitoringMinutes:
            testHealthUpdateInterval / millisecondsPerMinute,
          cidMonitoringMinutes:
            testHealthUpdateInterval / millisecondsPerMinute,
        },
        annotations: "new_star",
      };

      return await core.starFactory.createNewStar(
        "health_test_star",
        owners,
        doNothingHandler,
        new Date(),
        properties,
      );
    }

    async function connectStar(name, starId) {
      const core = createCore(name);
      return await core.starFactory.connectToStar(starId, doNothingHandler);
    }

    async function waitForHealthUpdate() {
      return new Promise((resolve) =>
        setTimeout(resolve, testHealthUpdateInterval),
      );
    }

    async function startStars(numStars) {
      const starter = await createStar(`star_1_${numStars}`);
      var stars = [];
      for (var i = 0; i < numStars - 1; i++) {
        const starName = `star_${i + 2}_${numStars}`;
        stars.push(await connectStar(starName, starter.starId));
      }
      await waitForHealthUpdate();
      await mockWaku.deliverAll();
      return [starter, ...stars];
    }

    for (var numStars = 2; numStars < 10; numStars++) {
      it(`measures channel health - ${numStars} stars`, async () => {
        const stars = await startStars(numStars);
        expect(stars.length).toEqual(numStars);

        stars.forEach((star) => {
          expect(star.isInitialized()).toBeTruthy();

          const health = star.health;
          const recent = new Date() - 2 * testHealthUpdateInterval;
          expect(health.channel.count).toEqual(numStars);
          expect(health.channel.lastUpdate.getTime()).toBeGreaterThan(recent);
        });
      });

      it(`measures data health - ${numStars} stars`, async () => {
        const stars = await startStars(numStars);
        expect(stars.length).toEqual(numStars);

        for (const star of stars) {
          expect(star.isInitialized()).toBeTruthy();
          await star.setAutoFetch(true);
        }

        await stars[0].setData("ThisIsTheData");
        // We need two update cycles here, because
        // during the first one, not all stars will receive the new CID before
        // receiving the health update messages for that cid. So
        // they will discard it. It's not worth building a caching system
        // for health messages for CIDs that *may at some point* become relevant.
        // if we wait an extra cycle, the stars reach agreement.
        await waitForHealthUpdate();
        await waitForHealthUpdate();

        stars.forEach((star) => {
          const health = star.health;
          const recent = new Date() - 2 * testHealthUpdateInterval;
          expect(health.cid.count).toEqual(numStars);
          expect(health.cid.lastUpdate.getTime()).toBeGreaterThan(recent);
        });
      });
    }

    it(`resets data health when CID changes`, async () => {
      const originalData = "OriginalData";
      const updateData = "UpdateData";
      const stars = await startStars(3);

      async function assertDataHealth(expected) {
        await waitForHealthUpdate();
        await waitForHealthUpdate();
        stars.forEach((star) => {
          const health = star.health;
          const recent = new Date() - 2 * testHealthUpdateInterval;
          expect(health.cid.count).toEqual(expected);
          expect(health.cid.lastUpdate.getTime()).toBeGreaterThan(recent);
        });
      }

      // We do not use autofetch.
      // We send out the original data, make sure everyone has it and agrees on the health numbers.
      await stars[0].setData(originalData);
      expect(await stars[1].getData()).toEqual(originalData);
      expect(await stars[2].getData()).toEqual(originalData);
      await assertDataHealth(3);

      // We change the data but do not download it.
      // This means only stars[0] has it.
      await stars[0].setData(updateData);
      await assertDataHealth(1);

      // Now we fetch the data to stars[1].
      // Two stars are holding the data.
      expect(await stars[1].getData(updateData)).toEqual(updateData);
      await assertDataHealth(2);

      // Now stars[2].
      expect(await stars[2].getData(updateData)).toEqual(updateData);
      await assertDataHealth(3);
    });
  },
);
