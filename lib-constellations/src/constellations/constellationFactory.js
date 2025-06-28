import { Wallet } from "ethers";
import { SinkLogger } from "../services/logger.js";
import { Constellation } from "./constellation.js";
import { ConstellationNode } from "./constellationNode.js";
import { Core } from "./core.js";
import { getConstellationStarType } from "./protocol.js";
import { WakuService } from "../services/wakuService.js";
import { CodexService } from "../services/codexService.js";
import { CryptoService } from "../services/cryptoService.js";

const doNothingStarHandler = {
  onDataChanged: async (star) => {},
  onPropertiesChanged: async (star) => {},
};

export class ConstellationFactory {
  constructor(logSink, privateKey, wakuNode, codexAddress) {
    const logger = new SinkLogger(logSink);
    const wallet = new Wallet(privateKey);
    const constellationNode = new ConstellationNode(wallet);
    const wakuService = new WakuService(logger, wallet, wakuNode);
    const codexService = new CodexService(logger, codexAddress);
    const cryptoService = new CryptoService(constellationNode);
    this._core = new Core(
      logger,
      constellationNode,
      wakuService,
      codexService,
      cryptoService,
    );
  }

  createNewConstellation = async (owners, eventHandler) => {
    const type = getConstellationStarType();
    const rootStar = await this._core.starFactory.createNewStar(type, owners, doNothingStarHandler);
    await rootStar.setData(JSON.stringify([]));
    
    const constellation = new Constellation(this._core, eventHandler);
    await constellation.initialize(rootStar.starId);

    await rootStar.disconnect();
    return constellation;
  };

  connectToConstellation = async (constellationId, eventHandler) => {
    const constellation = new Constellation(this._core, eventHandler);
    await constellation.initialize(constellationId);
    return constellation;
  };
}

export { ConstellationFactory };
