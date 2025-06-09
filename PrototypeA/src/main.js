#!/usr/bin/env node

import { Codex } from "@codex-storage/sdk-js";
import getDispatcher from "waku-dispatcher";
// import { DispatchMetadata, Dispatcher, Signer } from "waku-dispatcher";

const codexAddress = "http://192.168.178.26:8081";

function log(msg) {
  console.log(msg);
}

async function codexExample() {
  try {
    const codex = new Codex(codexAddress);
    const debug = codex.debug;
    const info = await debug.info();
    if (info == undefined) throw new Error("Not connected");
    log("Codex connected");
  } catch {
    log("Codex not connected");
  }
}

async function wakuExample() {
  try {
    const contentTopic = "/dispatcher-demo/1/example/json";
    const dbName = "temperature";
    const d = await getDispatcher(
      undefined,
      contentTopic,
      dbName,
      false,
      true,
      [
        "/dns4/waku.bloxy.one/tcp/8000/wss/p2p/16Uiu2HAmMJy3oXGzRjt2iKmYoCnaEkj55rE55YperMpemtGs9Da2",
      ],
    );
    if (d === null) log("didn't get dispatcher");

    log("Dispatched ready");
  } catch {
    log("Waku not connected");
  }
}

export async function main() {
  log("a");

  await codexExample();

  await wakuExample();
}
