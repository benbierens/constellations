import { getConstellationStarType } from "./protocol";

const exampleHandler = {
  onPathsUpdated: async () => {}
}

export class Constellation {
  constructor(core, handler = exampleHandler) {
    this._core = core;
    this._handler = handler;
    this._logger = core.logger.prefix("Constellation");

    // do not flatten.
    // paths need to exist behind the stars they came from
    // so that when they change, we can clean-wipe-update
    todo
    this._state = [
      {
        path: [],
        starId: "aaa",
        star: rootStar
      },
      {
        path: ["folder"],
        starId: "aaa",
        star: null // inactive
      },
      {
        path: ["file"],
        starId: "aaa",
        star: fileStar
      }
    ]
  }

  initialize = async (rootStarId) => {
    if (this._state.length > 0) this._logger.errorAndThrow("already initialized");

    todo
    this._state.push({
      path: [],
      starId: rootStarId,
      star: rootStar
    });

    // after this line, update events can trigger! set the state entry first.
    const rootStar = this._core.starFactory.connectToStar(rootStarId, this);


    // if (rootStar.starInfo.type != getConstellationStarType()) this._logger.errorAndThrow("Root star is not of constellation type");

    // await this._ingestConstellationStarData(rootStar, []);

    // this._logger.trace("initialize: initialized");
  }

  onDataChanged = async (star) => {}
  onPropertiesChanged = async (star) => {}

  activate = async (path) => {
    // path = "/folder" or "/file"
    // if path exists in star data, connect to that star
    // update star as active in state object
    // is constellation type? get the data, add to state object
    // public updated state object
  }

  deactivate = async (path) => {
    // reverse of above
    // if "/", deactivate all. empty state object
  }

  info = async (path) => {
    // path = "/folder"
    // if star at path is active, return all star info
    // if not found, or not active error
  }

  _ingestConstellationStarData = async (newStar, basePath) => {
    // Check that this star isn't already mapped somewhere.
    for (const entry of this._state) {
      if (entry.starId == newStar.starId) {
        this._logger.warn(`_ingestConstellationStarData: Attempt to add new star '${newStar.starId}' that is already known here '${entry.path}'`);
        return;
      }
    }

    const data = await newStar.getData();
    const json = JSON.parse(data);
    for (const entry of json) {
      await this._ingestConstellationStarDataEntry(basePath, entry);
    };
  }

  _ingestConstellationStarDataEntry = async (basePath, entry) => {
    //   entry: {
    //     "starId": "aaa",
    //     "path": [
    //       "rootfile"
    //     ]
    //   },

    const fullPath = [...basePath, ...entry.path];

    // Check this path isn't already mapped somewhere.
    for (const stateEntry of this._state) {
      if (this._core.pathsEqual(fullPath, stateEntry.path)) {
        this._logger.warn(`_ingestConstellationStarDataEntry: Attempt to add a new entry at '${fullPath}' for star '${entry.starId}' that already belongs to star '${stateEntry.starId}'`);
        return;
      }
    }

    this._state.push({
      starId: entry.starId,
      path: fullPath,
      star: null
    });

    this._logger.trace(`_ingestConstellationStarDataEntry: Learned of new star at '${fullPath}' with id '${entry.starId}'`);
  }
}
