import { StarChannelManager } from "./starChannel";

export class Core {
  constructor(logger, constellationNode, wakuService, codexService, cryptoService) {
    this.logger = logger;
    this.constellationNode = constellationNode;
    this.wakuService = wakuService;
    this.codexService = codexService;
    this.cryptoService = cryptoService;
    this.starChannelManager = new StarChannelManager(this);
  }

  sleep = async(ms) => {
      return new Promise(resolve => setTimeout(resolve, ms));
  };
}
