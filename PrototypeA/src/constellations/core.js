import { StarChannelFactory } from "./starChannelFactory.js";
import { StarFactory } from "./starFactory.js";

export class Core {
  constructor(
    logger,
    constellationNode,
    wakuService,
    codexService,
    cryptoService,
  ) {
    this.logger = logger;
    this.constellationNode = constellationNode;
    this.wakuService = wakuService;
    this.codexService = codexService;
    this.cryptoService = cryptoService;
    this.starChannelFactory = new StarChannelFactory(this);
    this.starFactory = new StarFactory(this);
  }

  sleep = async (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  };
}
