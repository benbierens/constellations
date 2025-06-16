import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { Logger } from "../src/services/logger";
import { ConstellationNode } from "../src/constellations/constellationNode";
import { Wallet } from "ethers";
import { CryptoService } from "../src/services/cryptoService";
import { WakuService } from "../src/services/wakuService";
import { CodexService } from "../src/services/codexService";
import { Core } from "../src/constellations/core";
import { WakuNode } from "../src/services/wakuNode";
import { MockCodexService, MockWakuService } from "./mocks";

const codexAddress = "http://192.168.178.26:8081";

const wakuBootstrapNodes = [
  "/dns4/waku.bloxy.one/tcp/8000/wss/p2p/16Uiu2HAmMJy3oXGzRjt2iKmYoCnaEkj55rE55YperMpemtGs9Da2",
  "/dns4/waku-test.bloxy.one/tcp/8095/wss/p2p/16Uiu2HAmSZbDB7CusdRhgkD81VssRjQV5ZH13FbzCGcdnbbh6VwZ",
  "/dns4/node-01.do-ams3.waku.sandbox.status.im/tcp/8000/wss/p2p/16Uiu2HAmNaeL4p3WEYzC9mgXBmBWSgWjPHRvatZTXnp8Jgv3iKsb",
];

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

        // star1 has received present and future data.
        expect(receivedData.length).toBe(2);
        expect(receivedData[0]).toEqual(presentData);
        expect(receivedData[1]).toEqual(futureData);
    })
});
