import { Wallet } from "ethers";


var newId = 1;

export class App {
  constructor() {
    this._constellations = {};

    // todo make configurable
    const wakuBootstrapNodes = [];
    const codexAddress = "";
    const wallet = Wallet.createRandom();

    this._wakuNode = new WakuNode

    const logger = new Logger();
    const constellationNode = new ConstellationNode(wallet);
    const cryptoService = new CryptoService(constellationNode);

    this._core = new Core(
      logger,
      constellationNode,
      new WakuService(logger, wallet, wakuNode),
      new CodexService(logger, codexAddress),
      cryptoService,
    );
  }

  get address() {
    return this._core.constellationNode.address;
  }

  getConstellationIds = () => {
    return Object.keys(this._constellations);
  };

  createNew = async (owners) => {
    const doNothingStarHandler = {
      onDataChanged: async (star) => {},
      onPropertiesChanged: async (star) => {},
    };

    const type = getConstellationStarType();
    const star = await this._core.starFactory.createNewStar(
      type,
      owners,
      doNothingStarHandler,
    );
    await star.setData(JSON.stringify([]));

    const result = await this.connectNew(star.starId);
    await star.disconnect();
    return result;
  };

  connectNew = async (constellationId) => {
    newId++;
    const handler = new ConstellationHandler(newId);
    const constellation = new Constellation(this._core, handler);
    await constellation.initialize(constellationId);
    this._constellations[newId] = {
      id: newId,
      constellation: constellation,
      handler: handler,
    };
    return newId;
  };

  disconnect = async (id) => {
    const constellation = this._constellations[id];
    delete this._constellations[id];
    await constellation.disconnect();
  };
}

class ConstellationHandler {
  constructor(id) {
    this._id = id;
  }

  onPathsUpdated = async (starId) => {};
  onPropertiesChanged = async (starId) => {};
  onDataChanged = async (starId) => {};
}
