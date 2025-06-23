import { TimerService } from "../services/timerService.js";
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
    this.timerService = new TimerService(this);
  }

  sleep = async (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  };

  arraysEqual = (a, b) => {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length !== b.length) return false;

    for (var i = 0; i < a.length; i++) {
      if (!a.includes(b[i])) return false;
    }
    return true;
  };

  generateStarId = (starInfo) => {
    if (!starInfo.type)
      this.logger.errorAndThrow(
        "generateStarId: starInfo object is missing type.",
      );
    if (!starInfo.owners)
      this.logger.errorAndThrow(
        "generateStarId: starInfo object is missing owners.",
      );
    if (!starInfo.creationUtc)
      this.logger.errorAndThrow(
        "generateStarId: starInfo object is missing creationUtc.",
      );

    const json = JSON.stringify(starInfo);
    return "s" + this.cryptoService.sha256(json);
  };

  pathsEqual = (path1, path2) => {
    if (path1.length != path2.length) return false;
    for (var i = 0; i < path1.length; i++) {
      if (path1[i] != path2[i]) return false;
    }
    return true;
  }
}
