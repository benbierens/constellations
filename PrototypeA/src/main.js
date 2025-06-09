#!/usr/bin/env node
import { Logger } from "./services/logger.js";
import { CodexService } from "./services/codexService.js";
import { WakuService } from "./services/wakuService.js";
import { Wallet } from "ethers";

const privateKey =
  "0x821f73df2d38ac506e9735306766be701afcec7def45f7bfa184b6fd4e96185d";
const address = "0xd2a1FE498fEA6d3f188C2e6208AA55D7e8eaBdc0";
// mnemonic: legend culture forum control what render switch above impose surge grab edge

const codexAddress = "http://192.168.178.26:8081";
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

export async function main() {
  log("Initializing...");

  const wallet = new Wallet(privateKey);
  const codexService = new CodexService(logger, codexAddress);
  const wakuService = new WakuService(logger, wallet, wakuBootstrapNodes);

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

  log("");
  log("Try Waku...");

  await wakuService.start();
  log("Started.");

  const handler = {
    onMessage: async (signer, msg) => {
      log(`Received. Signer: '${signer}' Msg: '${msg}'`);
    },
  };

  const channel = await wakuService.openChannel("Aww-yeah!", handler);
  log("Channel open");

  await channel.send("Let there be MSG!");
  log("Message sent");

  await channel.close();
  log("Channel closed");

  log("All done! \\o/");
}
