import { getConstellationStarType } from "./protocol";

const exampleHandler = {
  onPathsUpdated: async (starId) => {},
};

export class Constellation {
  constructor(core, handler = exampleHandler) {
    this._core = core;
    this._handler = handler;
    this._logger = core.logger.prefix("Constellation");

    this._activeStars = [];
    this._root = null;
    // [
    //   {
    //     path: "",
    //     starId: "aaa",
    //     star: rootStar,
    //     entries: [
    //       {
    //         path: "folderName",
    //         starId: "bbb",
    //         star: null, // inactive
    //         entries: [], // not known because not active
    //       },
    //       {
    //         path: "fileName",
    //         starId: "ccc",
    //         star: star,
    //         entries: [], // leaf node
    //       },
    //       {
    //         path: "folderActive",
    //         starId: "ddd",
    //         star: star,
    //         entries: [
    //           {
    //             path: "nestedFile",
    //             starId: "eee",
    //             star: null,
    //             entries: [],
    //           },
    //         ],
    //       },
    //     ],
    //   },
    // ];
  }

  initialize = async (rootStarId) => {
    if (this._root)
      this._logger.errorAndThrow("initialize: already initialized");

    this._logger.trace("initialize: initializing...");

    this._root = {
      path: "",
      starId: rootStarId,
      star: null,
      entries: [],
    };

    // after this line, update events will trigger. _root must be set before this.
    // we expect a data callback and we'll process the root entries from there.
    this._root.star = await this._activateStar(rootStarId);

    if (!this._isConstellation(this._root.star))
      this._logger.errorAndThrow("Root star is not a constellation type");
  };

  get root() {
    return this._map(this._root);
  }

  activate = async (path) => {
    var entry = this._findEntryByFullPath(path);
    if (!entry) return;

    if (entry.star) {
      this._logger.warn(`activate: star '${entry.starId}' already active`);
      return;
    }

    this._logger.trace(`activate: activating star '${entry.starId}'...`);
    entry.star = await this._activateStar(entry.starId);
    // the onDataChanged callback will handle the unpacking of a constellation type star.
  };

  deactivate = async (path) => {
    var entry = this._findEntryByFullPath(path);
    if (!entry) return;

    if (!entry.star) {
      this._logger.warn(`deactivate: star '${entry.starId}' not active`);
      return;
    }

    this._logger.trace(`deactivate: deactivating star '${entry.starId}'...`);
    await this._deactivateStar(entry.star);
    entry.star = null;
    entry.entries = [];

    await this._raisePathsChangedEvent(entry.starId);
  };

  info = async (path) => {
    // path = "/folder"
    // if star at path is active, return all star info
    // if not found, or not active error
  };

  onDataChanged = async (star) => {
    // If this is one of our constellation type stars, we must fetch the data and update our tree.
    if (!this._isConstellation(star)) {
      this._logger.trace(
        `onDataChanged: star '${star.starId}' is not a constellation type`,
      );
      return;
    }

    const entry = this._findEntryByStarId(this._root, star.starId);
    if (!entry) {
      this._logger.trace(
        `onDataChanged: no entry found for star '${star.starId}'`,
      );
      return;
    }

    await this._updateEntry(entry, star);
  };

  onPropertiesChanged = async (star) => {};

  _updateEntry = async (here, star) => {
    if (here.starId != star.starId)
      this._logger.assert("_updateEntry: Inconsistent starId");

    const data = await star.getData();
    const update = JSON.parse(data);

    //   [
    //    {
    //     "starId": "aaa",
    //     "path": "rootfile"
    //    },
    //    ...
    //  ]

    var changed = false;

    const updateStarIds = update.map((e) => e.starId);
    // for each entry that already exists but doesn't exist in the update
    // we must deactivate the star if it is active.
    // todo: this implies that the star.status was switched to COLD and support is no longer
    // wanted for it. But this isn't necessarily true. It's possible the star got
    // kicked out of the constellation but remains active independently.
    // so, todo, check this and communicate it to the user somehow.
    const copy = [...here.entries];
    for (const oldEntry of copy) {
      if (!updateStarIds.includes(oldEntry.starId)) {
        if (oldEntry.star) {
          await this._deactivateStar(oldEntry.star);
          oldEntry.star = null;
        }
        const idx = here.entries.indexOf(oldEntry);
        here.entries.splice(idx, 1);
        this._logger.trace(
          `_updateEntry: removed old entry for star '${oldEntry.starId}'`,
        );
        changed = true;
      }
    }

    const existingStarIds = here.entries.map((e) => e.starId);
    // each new entry should be added, but not automatically activated.
    // each existing entry, maybe the path changed, check and update if needed.
    for (const newEntry of update) {
      if (existingStarIds.includes(newEntry.starId)) {
        const existingEntry = this._findEntryByStarId(here, newEntry.starId);
        if (newEntry.path != existingEntry.path) {
          this._logger.trace(
            `_updateEntry: name '${existingEntry.path}' changed to '${newEntry.path}'`,
          );
          existingEntry.path = newEntry.path;
          changed = true;
        }
      } else {
        here.entries.push({
          path: newEntry.path,
          starId: newEntry.starId,
          star: null,
          entries: [],
        });
        changed = true;
      }
    }

    // entry was updated. If there were changes, raise the event.
    if (changed) {
      await this._raisePathsChangedEvent(here.starId);
    }
  };

  _isConstellation = (star) => {
    return star.starInfo.type == getConstellationStarType();
  };

  _findEntryByStarId = (start, starId) => {
    var todo = [start];
    while (todo.length > 0) {
      const current = todo.pop();
      if (!current) return null;
      if (current.starId == starId) return current;
      todo = todo.concat(current.entries);
    }
  };

  _findEntryByFullPath = (fullPath) => {
    var entry = this._root;
    for (const part of fullPath) {
      entry = this._findEntryByPath(entry, part);
      if (!entry) {
        this._logger.warn(
          `_findEntryByFullPath: full path '${fullPath}' does not exist.`,
        );
        return null;
      }
    }
    return entry;
  };

  _findEntryByPath = (here, path) => {
    for (const entry of here.entries) {
      if (entry.path == path) return entry;
    }
    this._logger.trace(`_findEntryByPath: Unable to find path '${path}'`);
    return null;
  };

  _activateStar = async (starId) => {
    const star = await this._core.starFactory.connectToStar(starId, this);
    this._activeStars.push(star);
    this._logger.trace("_activateStar: success");
    return star;
  };

  _deactivateStar = async (star) => {
    const index = this._activeStars.indexOf(star);
    if (index < 0)
      this._logger.assert("_deactivateStar: active star not found");
    this._activeStars = this._activeStars.splice(index, 1);
    await star.disconnect();
    this._logger.trace("_deactivateStar: success");
  };

  _raisePathsChangedEvent = async (starId) => {
    await this._handler.onPathsUpdated(starId);
  };

  _map = (entry) => {
    var isActive = false;
    if (entry.star) isActive = true;

    return {
      path: entry.path,
      starId: entry.starId,
      isActive: isActive,
      entries: entry.entries.map((e) => this._map(e)),
    };
  };
}
