#!/usr/bin/env node
import { Logger } from "./services/logger.js";
import { CodexService } from "./services/codexService.js";
import { WakuService } from "./services/wakuService.js";
import { createNewStarExample } from "./createNewStar.js";
import { Core } from "./constellations/core.js";
import { CryptoService } from "./services/cryptoService.js";
import { ConstellationNode } from "./constellations/constellationNode.js";

const privateKey =
  "0x821f73df2d38ac506e9735306766be701afcec7def45f7bfa184b6fd4e96185d";
const address = "0xd2a1FE498fEA6d3f188C2e6208AA55D7e8eaBdc0";
// mnemonic: legend culture forum control what render switch above impose surge grab edge

//const codexAddress = "http://192.168.178.26:8081";
const codexAddress = "http://192.168.178.171:8080";

const wakuBootstrapNodes = [
  "/dns4/waku.bloxy.one/tcp/8000/wss/p2p/16Uiu2HAmMJy3oXGzRjt2iKmYoCnaEkj55rE55YperMpemtGs9Da2",
  "/dns4/waku-test.bloxy.one/tcp/8095/wss/p2p/16Uiu2HAmSZbDB7CusdRhgkD81VssRjQV5ZH13FbzCGcdnbbh6VwZ",
  "/dns4/node-01.do-ams3.waku.sandbox.status.im/tcp/8000/wss/p2p/16Uiu2HAmNaeL4p3WEYzC9mgXBmBWSgWjPHRvatZTXnp8Jgv3iKsb",
];

const logger = new Logger();

function log(msg) {
  logger.trace(msg);
}

var fileData = new Uint8Array(100);
fileData[0] = 11;
fileData[11] = 22;
fileData[22] = 55;

async function codexExample(codexService) {
  log("");
  log("Trying Codex...");

  log("Is online?: " + (await codexService.isOnline()));

  const cid = await codexService.upload(fileData);
  log("Uploaded to: " + cid);

  const manifest = await codexService.getManifest(cid);
  log("Manifest. Size: " + manifest.datasetSize);

  await codexService.fetchData(cid);
  log("Fetched data");

  const content = await codexService.downloadData(cid);
  log("Download data: " + JSON.stringify(content));
}

async function wakuExample(wakuService) {
  log("");
  log("Try Waku...");

  const handler = {
    onMessage: async (signer, timestamp, msg) => {
      log(
        `Received. Signer: '${signer}' Timestamp: '${timestamp.toISOString()}' Msg: '${msg}'`,
      );
    },
  };

  const contentTopic = "/constellations/1/testing/json";
  const channel = await wakuService.openChannel(contentTopic, handler);
  log("Channel open");

  await channel.send(`Let there be MSG! (${new Date().toISOString()})`);
  log("Message sent");

  await channel.close();
  log("Channel closed");
}

export async function main() {
  log("Initializing...");

  const constellationNode = new ConstellationNode(privateKey);
  const codexService = new CodexService(logger, codexAddress);
  const wakuService = new WakuService(
    logger,
    constellationNode.wallet,
    wakuBootstrapNodes,
  );

  await wakuService.start();
  log("Started Waku service.");

  // await codexExample(codexService);
  // await wakuExample(wakuService);

  const cryptoService = new CryptoService();
  const core = new Core(
    logger,
    constellationNode,
    wakuService,
    codexService,
    cryptoService,
  );

  await createNewStarExample(core);

  await wakuService.stop();
  log("Stopped Waku service");
}
