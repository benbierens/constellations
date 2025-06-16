import "fake-indexeddb/auto";
import { Protocols, createLightNode } from "@waku/sdk";

const networkConfig = { clusterId: 42, shards: [0] };

export class WakuNode {
  constructor(logger, bootstrapNodes) {
    this.logger = logger.prefix("WakuNode");
    this.bootstrapNodes = bootstrapNodes;
  }

  start = async () => {
    this.node = await createLightNode({
      networkConfig: networkConfig,
      defaultBootstrap: false,
      bootstrapPeers: this.bootstrapNodes,
      numPeersToUse: 3,
    });
    await this.node.start();
    this.logger.trace("Waiting for peers...");
    await this.node.waitForPeers([
      Protocols.Store,
      Protocols.Filter,
      Protocols.LightPush,
    ]);
    this.logger.trace("Ready.");
  };

  stop = async () => {
    await this.node.stop();
  };
}
