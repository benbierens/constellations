#!/usr/bin/env node

import { Codex } from "@codex-storage/sdk-js";
import { NodeUploadStategy } from "@codex-storage/sdk-js/node";

import "fake-indexeddb/auto";
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

    // is alive?
    const info = await debug.info();
    if (info == undefined) throw new Error("Not connected");

    // upload
    const data = codex.data;
    var fileData = new Uint8Array(100);
    fileData[0] = 11;
    fileData[11] = 22;
    fileData[22] = 55;
    const metadata = {
      filename: "example",
      mimetype: "application/octet-stream",
    };
    const strategy = new NodeUploadStategy(fileData, metadata);
    // const strategy = new BrowserUploadStrategy(file, onProgress, metadata);
    log("uploading..");
    const uploadResponse = data.upload(strategy);
    const res = await uploadResponse.result;
    if (res.error) {
      throw new Error(res.data);
    }
    log("uploaded: " + res.data);
    const cid = res.data;

    // download manifest only
    const manifest = await data.fetchManifest(cid);
    log(
      "manifest, size: " + JSON.stringify(manifest.data.manifest.datasetSize),
    );

    // download data
    const response = await data.networkDownloadStream(cid);
    const downloaded = await response.data.text();
    log("downloaded: " + JSON.stringify(downloaded));

    log("Codex connected");
  } catch (error) {
    log("Codex not connected: " + error);
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
  } catch (error) {
    log("Waku not connected: " + error);
  }
}

export async function main() {
  log("a");

  //await codexExample();

  await wakuExample();
}
