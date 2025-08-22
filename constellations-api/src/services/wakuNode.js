import "fake-indexeddb/auto";
import { Protocols, createLightNode } from "@waku/sdk";

const networkConfig = { clusterId: 42, shards: [0] };

export class WakuNode {
  constructor(logger) {
    this.logger = logger.prefix("WakuNode");
  }

  startFromNode = async (wakuLightNode) => {
    this.node = wakuLightNode;
    this.logger.trace("Started from waku node.");
  };

  startFromBootstrapNodes = async (bootstrapNodes) => {
    this.node = await createLightNode({
      /*networkConfig: networkConfig,
      defaultBootstrap: false,
      bootstrapPeers: bootstrapNodes,
      numPeersToUse: 3,*/
      defaultBootstrap: true,
    });
    await this.node.start();
    this.logger.trace("Waiting for peers...");
    await this.node.waitForPeers([
      Protocols.Store,
      Protocols.Filter,
      Protocols.LightPush,
    ]);
    this.logger.trace("Started from bootstrap nodes.");
  };

  stop = async () => {
    await this.node.stop();
  };
}
