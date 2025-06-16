import { afterEach, beforeEach, describe, it } from "vitest";
import { Logger } from "../src/services/logger";
import { ConstellationNode } from "../src/constellations/constellationNode";
import { Wallet } from "ethers";
import { CryptoService } from "../src/services/cryptoService";
import { WakuService } from "../src/services/wakuService";
import { CodexService } from "../src/services/codexService";
import { Core } from "../src/constellations/core";

const codexAddress = "http://192.168.178.26:8081";

const wakuBootstrapNodes = [
  "/dns4/waku.bloxy.one/tcp/8000/wss/p2p/16Uiu2HAmMJy3oXGzRjt2iKmYoCnaEkj55rE55YperMpemtGs9Da2",
  "/dns4/waku-test.bloxy.one/tcp/8095/wss/p2p/16Uiu2HAmSZbDB7CusdRhgkD81VssRjQV5ZH13FbzCGcdnbbh6VwZ",
  "/dns4/node-01.do-ams3.waku.sandbox.status.im/tcp/8000/wss/p2p/16Uiu2HAmNaeL4p3WEYzC9mgXBmBWSgWjPHRvatZTXnp8Jgv3iKsb",
];

describe("TwoStarTest", () => {
    const logger = new Logger("TwoStarTest");
    const codexService = new CodexService(logger, codexAddress);

    async function createCore(name) {
        const myLogger = logger.prefix(name);
        const wallet = Wallet.createRandom();
        const constellationNode = new ConstellationNode(wallet);
        const cryptoService = new CryptoService(constellationNode);
        const wakuService = new WakuService(
        myLogger,
        wallet,
        wakuBootstrapNodes,
        );
    
        await wakuService.start();
        
        return new Core(
            myLogger,
            constellationNode,
            wakuService,
            codexService,
            cryptoService,
        );
    }

    async function destroyCore(core) {
        await core.wakuService.stop();
    }

    var core1 = {};
    var core2 = {};

    beforeEach(async () =>{
        if (!await codexService.isOnline()) logger.errorAndThrow("Test requires a codex node.");

        core1 = await createCore("One");
        core2 = await createCore("Two");
    }, 60 * 1000);

    afterEach(async () => {
        await destroyCore(core1);
        await destroyCore(core2);

    })



    it("runs", async () => {
        console.log("a");


    })
});
