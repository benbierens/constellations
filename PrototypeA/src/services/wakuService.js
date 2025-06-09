import "fake-indexeddb/auto";
import { Protocols, createLightNode, waitForRemotePeer } from "@waku/sdk";
import { DispatchMetadata, Dispatcher, Signer } from "waku-dispatcher/dist";
import { LightNode } from "@waku/interfaces";
import { Dispatcher } from "./dispatcher.js";
import { Store } from "./storage/store.js";

const messageType = "???";

export class WakuChannel {
  constructor(logger, handler, wallet, dispatcher, contentTopic) {
    this.logger = logger;
    this.handler = handler;
    this.wallet = wallet;
    this.dispatcher = dispatcher;
    this.contentTopic = contentTopic;

    const onMessage = async (msg, signer, meta) => {
      this.log("Received message");
      await handler.onMessage(signer, msg);
    };

    this.dispatcher.on(
      messageType,
      onMessage,
      true, // verify sender
      true, // accept only encrypted
      this.contentTopic,
      true, // store locally
    );
    this.dispatcher.dispatchLocalQuery();
    this.log("Channel is open.");
  }

  send = async (msg) => {
    const res = await dispatcher.emit(messageType, msg, wallet);
    this.log(`Send message. (${res})`);
  };

  close = async () => {
    await this.dispatcher.stop();
    this.dispatcher = null;
    this.log("Channel is closed.");
  };

  log = (msg) => {
    this.logger.trace(`Channel [${this.contentTopic}] ${msg}`);
  };
}

export class WakuService {
  constructor(logger, wallet, bootstrapNodes) {
    this.logger = logger;
    this.wallet = wallet;
    this.bootstrapNodes = bootstrapNodes;
  }

  start = async () => {
    this.node = await createLightNode({
      defaultBootstrap: true,
      bootstrapPeers: this.bootstrapNodes,
    });
    this.node.start();
    await waitForRemotePeer(node, [
      Protocols.LightPush,
      Protocols.Filter,
      Protocols.Store,
    ]);
  };

  openChannel = async (contentTopic, handler, ephemeral = true) => {
    const store = new Store(`constellations-${contentTopic}`);
    await store.ready();
    this.logger.trace("Store ready");
    const dispatcher = new Dispatcher(
      this.node,
      contentTopic,
      ephemeral,
      store,
    );
    await dispatcher.start();
    this.logger.trace("Dispatcher started");

    return new WakuChannel(this.logger, handler, this.wallet, dispatcher);
  };
}
