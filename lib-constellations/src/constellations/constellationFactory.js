import { Wallet } from "ethers";
import { SinkLogger } from "../services/logger.js";
import { Constellation } from "./constellation.js";
import { ConstellationNode } from "./constellationNode.js";
import { Core } from "./core.js";
import { getConstellationStarType } from "./protocol.js";
import { WakuService } from "../services/wakuService.js";
import { CodexService } from "../services/codexService.js";
import { CryptoService } from "../services/cryptoService.js";
import { WakuNode } from "../services/wakuNode.js";
import { MockWaku } from "../../tests/mockWaku.js";
import { MockCodexService } from "../../tests/mockCodex.js";
import { StartupChecks } from "../../../../../lib-constellations/src/constellations/startupChecks.js";

const doNothingStarHandler = {
  onDataChanged: async (star) => {},
  onPropertiesChanged: async (star) => {},
};

export class ConstellationFactory {
  constructor(logSink, privateKey, codexAddress) {
    this._codexAddress = codexAddress;
    this._logger = new SinkLogger(logSink);
    this._wallet = new Wallet(privateKey);
    this._constellationNode = new ConstellationNode(this._wallet);
    this._cryptoService = new CryptoService(this._constellationNode);
  }

  initializeWithNode = async (wakuLightNode) => {
    this._codexService = new CodexService(this._logger, codexAddress);

    const wakuNode = new WakuNode(this._logger);
    await wakuNode.startFromNode(wakuLightNode);

    const wakuService = new WakuService(this._logger, this._wallet, wakuNode);
    this._core = new Core(
      this._logger,
      this._constellationNode,
      wakuService,
      this._codexService,
      this._cryptoService,
    );
    
    await this._startupChecks();
  };

  initializeWithBootstrapRecords = async (wakuBootstrapNodes) => {
    this._codexService = new CodexService(this._logger, codexAddress);

    const wakuNode = new WakuNode(this._logger);
    await wakuNode.startFromBootstrapNodes(wakuBootstrapNodes);

    const wakuService = new WakuService(this._logger, this._wallet, wakuNode);
    this._core = new Core(
      this._logger,
      this._constellationNode,
      wakuService,
      this._codexService,
      this._cryptoService,
    );

    await this._startupChecks();
  };

  initializeWithMocks = async () => {
    this._codexService = new MockCodexService();
    var mockWaku = new MockWaku();

    const wakuService = mockWaku.createMockWakuServiceForAddress(
      this._constellationNode.address,
    );
    this._core = new Core(
      this._logger,
      this._constellationNode,
      wakuService,
      this._codexService,
      this._cryptoService,
    );
  };

  get walletAddress() {
    return this._core.constellationNode.address;
  }

  createNewConstellation = async (owners, eventHandler) => {
    const type = getConstellationStarType();
    const rootStar = await this._core.starFactory.createNewStar(
      type,
      owners,
      doNothingStarHandler,
    );
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

  _startupChecks = async () => {
    const checker = new StartupChecks(this._core);
    await checker.performChecks();
  }
}
