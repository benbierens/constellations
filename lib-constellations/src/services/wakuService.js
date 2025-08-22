import "fake-indexeddb/auto";
import { Protocols, createLightNode, waitForRemotePeer } from "@waku/sdk";
// import { DispatchMetadata, Dispatcher, Signer } from "waku-dispatcher/dist";
// import { LightNode } from "@waku/interfaces";
import { Dispatcher, Store } from "waku-dispatcher";

const messageType = "yes";

export class WakuChannel {
  constructor(logger, handler, wallet, dispatcher, contentTopic) {
    this.logger = logger.prefix(contentTopic);
    this.handler = handler;
    this.wallet = wallet;
    this.dispatcher = dispatcher;
    this.contentTopic = contentTopic;

    const onMessage = async (msg, signer, meta) => {
      this.log("Received message.");
      const timestamp = new Date(meta.timestamp);
      try {
        await handler.onMessage(signer, timestamp, msg);
      } catch (error) {
        this.logger.errorAndThrow("onMessage: Error in handler: " + error);
      }
    };

    this.dispatcher.on(
      messageType,
      onMessage,
      true, // verify sender
      false, // accept only encrypted
      this.contentTopic,
      false, // store locally
    );
    this.log("Channel is open.");
  }

  start = async () => {
    await this.dispatcher.start();
    await this.dispatcher.dispatchLocalQuery();
  };

  send = async (msg) => {
    const res = await this.dispatcher.emitTo(
      this.dispatcher.encoder,
      messageType,
      msg,
      this.wallet,
    );
    this.log(`Send message. (${res})`);
  };

  close = async () => {
    await this.dispatcher.stop();
    this.dispatcher = null;
    this.log("Channel is closed.");
  };

  log = (msg) => {
    this.logger.trace(msg);
  };
}

export class WakuService {
  constructor(logger, wallet, wakuNode) {
    this.logger = logger.prefix("Waku");
    this.wallet = wallet;
    this.wakuNode = wakuNode;
  }

  openChannel = async (contentTopic, handler, ephemeral = true) => {
    const store = new Store(`constellations-${contentTopic}`);
    await store.ready();
    this.logger.trace("Store ready");
    const dispatcher = new Dispatcher(
      this.wakuNode.node,
      contentTopic,
      ephemeral,
      store,
    );

    // todo:
    // dispatcher.registerKey(key: Uint8Array, type: KeyType = KeyType.Asymetric, autoEncrypt: boolean = false)
    // and turn on "accept only encrypted"

    const channel = new WakuChannel(
      this.logger,
      handler,
      this.wallet,
      dispatcher,
      contentTopic,
    );

    this.logger.trace("Dispatcher started");

    return channel;
  };
}
