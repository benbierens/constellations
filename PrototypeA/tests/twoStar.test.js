import { beforeEach, describe, expect, it } from "vitest";
import { Logger } from "../src/services/logger";
import { ConstellationNode } from "../src/constellations/constellationNode";
import { Wallet } from "ethers";
import { CryptoService } from "../src/services/cryptoService";
import { Core } from "../src/constellations/core";
import { MockCodexService, MockWakuService } from "./mocks";

describe("TwoStarTest", () => {
    const logger = new Logger("TwoStarTest");
    const codexService = new MockCodexService();
    const wakuService = new MockWakuService();

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
    var core2 = {};

    beforeEach(() =>{
        core1 = createCore("One");
        core2 = createCore("Two");
    });

    async function createStar(core, type, handler) {
        const owners = [core.constellationNode.address];
        return await core.starFactory.createNewStar(
            type,
            owners,
            handler,
        );
    }

    async function connectStar(core, starId, handler) {
        return await core.starFactory.connectToStar(starId, handler);
    }

    it("runs", async () => {
        const pastData = "pastData";
        const presentData = "presentData";
        const futureData = "futureData";

        const doNothingHandler = {
            onDataChanged: async (star) => {}
        };
        const star1 = await createStar(core1, "test_star", doNothingHandler);
        const starId = star1.starId;

        // Set past and present data before second node connects.
        await star1.setData(pastData);
        await star1.setData(presentData);

        var receivedData = [];
        const receiveHandler = {
            onDataChanged: async (star) => {
                receivedData.push(await star.getData());
            }
        };
        const star2 = await connectStar(core2, starId, receiveHandler);

        // Set future data.
        await star1.setData(futureData);

        // star2 has received present and future data.
        expect(receivedData).toEqual([presentData, futureData]);
    })
});
