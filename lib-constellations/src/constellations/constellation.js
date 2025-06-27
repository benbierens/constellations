import { getConstellationStarType, isValidUserStringValue } from "./protocol";
import { StarStatus } from "./starProperties";

const exampleHandler = {
  onPathsUpdated: async (starId) => {},
  onPropertiesChanged: async (starId) => {},
  onDataChanged: async (starId) => {},
};

export class Constellation {
  constructor(core, handler = exampleHandler) {
    this._core = core;
    this._handler = handler;
    this._logger = core.logger.prefix("Constellation");

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
    this._root.star = await this._core.starFactory.connectToStar(
      rootStarId,
      this,
    );

    if (!this._isConstellation(this._root.star))
      this._logger.errorAndThrow("Root star is not a constellation type");
  };

  disconnect = async () => {
    const logger = this._logger;
    logger.trace("disconnect: Disconnecting...");

    await this._disconnectAll(this._root);

    this._core = null;
    this._handler = null;
    this._logger = null;
    this._root = null;

    logger.trace("disconnect: Disconnected");
  };

  _disconnectAll = async (entry) => {
    for (const e of entry.entries) {
      await this._disconnectAll(e);
    }
    if (entry.star) {
      await entry.star.disconnect();
      entry.star = null;
    }
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
    entry.star = await this._core.starFactory.connectToStar(entry.starId, this);
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
    await entry.star.disconnect();
    entry.star = null;
    entry.entries = [];

    await this._raisePathsChangedEvent(entry.starId);
  };

  info = (path) => {
    const star = this._findActiveStarByFullPath(path);
    if (!star) return;

    const props = star.properties;
    return {
      starId: star.starId,
      path: path,
      starInfo: star.starInfo,
      health: star.health,
      size: star.size,
      lastChangeUtc: star.lastChangeUtc,
      properties: {
        status: props.status,
        configuration: {
          maxDiffSize: props.configuration.maxDiffSize,
          softMinSnapshotDuration: props.configuration.softMinSnapshotDuration,
          softMaxDiffDuration: props.configuration.softMaxDiffDuration,
          softMaxNumDiffs: props.configuration.softMaxNumDiffs,
          channelMonitoringMinutes:
            props.configuration.channelMonitoringMinutes,
          cidMonitoringMinutes: props.configuration.cidMonitoringMinutes,
        },
        admins: props.admins,
        mods: props.mods,
        annotations: props.annotations,
      },
    };
  };

  updateProperties = async (path, properties) => {
    const star = this._findActiveStarByFullPath(path);
    if (!star) return;

    const i = properties;
    if (!i) return;
    const c = i.configuration;
    const p = star.properties;

    if (i.status) p.status = i.status;
    if (i.admins) p.admins = i.admins;
    if (i.mods) p.mods = i.mods;
    if (i.annotations) p.annotations = i.annotations;

    if (c) {
      if (c.maxDiffSize) p.configuration.maxDiffSize = c.maxDiffSize;
      if (c.softMinSnapshotDuration)
        p.configuration.softMinSnapshotDuration = c.softMinSnapshotDuration;
      if (c.softMaxDiffDuration)
        p.configuration.softMaxDiffDuration = c.softMaxDiffDuration;
      if (c.softMaxNumDiffs)
        p.configuration.softMaxNumDiffs = c.softMaxNumDiffs;
      if (c.channelMonitoringMinutes)
        p.configuration.channelMonitoringMinutes = c.channelMonitoringMinutes;
      if (c.cidMonitoringMinutes)
        p.configuration.cidMonitoringMinutes = c.cidMonitoringMinutes;
    }

    await p.commitChanges();
  };

  getData = async (path) => {
    const star = this._findActiveStarByFullPath(path);
    if (!star) return;
    return await star.getData();
  };

  setData = async (path, newData) => {
    const star = this._findActiveStarByFullPath(path);
    if (!star) return;

    if (this._isConstellation(star)) {
      this._logger.warn(
        `setData: Attempt to modify constellation-type star data directly at path '${path}'. Use constellation methods instead.`,
      );
      return;
    }
    return await star.setData(newData);
  };

  fetch = async (path) => {

  }

  setAutoFetch = async (path, autoFetch) => {
    
  }

  createNewFile = async (path, type, owners) => {
    if (!type) this._logger.errorAndThrow("createNewFile: Type not provided.");
    if (!isValidUserStringValue(type))
      this._logger.errorAndThrow("createNewFile: Invalid input for 'type'.");

    return await this._createNewStar(path, type, owners);
  };

  createNewFolder = async (path, owners) => {
    return await this._createNewStar(path, getConstellationStarType(), owners);
  };

  delete = async (path, updateStarStatus) => {
    if (path.length == 0)
      this._logger.errorAndThrow(
        "delete: Attempt to delete root. This is not implemented yet.",
      );

    const entry = this._findEntryByFullPath(path);
    if (!entry) return;
    if (!entry.star)
      this._logger.errorAndThrow(`delete: '${path}' is not active.`);

    const parentPath = [...path];
    const pathHead = parentPath.pop();
    const parentStar = this._findActiveStarByFullPath(parentPath);

    this._print("before star delete");

    this._logger.trace(
      `delete: At path '${path}' deleting star '${entry.starId}'...`,
    );

    if (updateStarStatus) {
      entry.star.properties.status = StarStatus.Cold;
      await entry.star.properties.commitChanges();
      this._logger.trace("delete: Star status updated.");
    }

    await entry.star.disconnect();
    entry.star = null;

    this._logger.trace("delete: Updating local structure...");
    const parentEntry = this._findEntryByFullPath(parentPath);

    var newEntries = [];
    for (const e of parentEntry.entries) {
      if (e.starId != entry.starId) {
        newEntries.push(e);
      }
    }
    parentEntry.entries = newEntries;

    this._print("after parentEntry update");

    await this._packUpEntryToStarData(parentStar, parentEntry);

    this._logger.trace("delete: Done");
  };

  _createNewStar = async (path, type, owners) => {
    if (path.length < 1)
      this._logger.errorAndThrow("_createNewStar: Invalid path: empty.");
    if (this._findEntryByFullPath(path))
      this._logger.errorAndThrow(
        `_createNewStar: Invalid path '${path}'. Already exists.`,
      );
    if (!type) this._logger.errorAndThrow("_createNewStar: Type not provided.");
    if (!owners || owners.length < 1)
      this._logger.errorAndThrow(
        "_createNewStar: One or more owners required.",
      );

    const parentPath = [...path];
    const pathHead = parentPath.pop();
    const parentStar = this._findActiveStarByFullPath(parentPath);
    if (!parentStar)
      this._logger.errorAndThrow(
        `_createNewStar: Attempt to create star at '${path}' requires modification to constellation type at '${parentPath}' which was not found.`,
      );
    if (!this._isConstellation(parentStar))
      this._logger.errorAndThrow(
        `_createNewStar: Attempt to create star at '${path}' requires modification to '${parentPath}' which is not a constellation type.`,
      );
    if (!parentStar.canModifyData())
      this._logger.errorAndThrow(
        `_createNewStar: Attempt to create star at '${path}' requires modification to constellation type at '${parentPath}' which is not permitted.`,
      );

    this._print("before star create");

    this._logger.trace(
      `_createNewStar: At path '${path}' creating a new star of type '${type}' with owners '${owners}'...`,
    );
    const newStar = await this._core.starFactory.createNewStar(
      type,
      owners,
      this,
    );

    this._logger.trace("_createNewStar: Updating local structure...");
    const parentEntry = this._findEntryByFullPath(parentPath);
    parentEntry.entries.push({
      path: pathHead,
      starId: newStar.starId,
      star: newStar,
      entries: [],
    });

    this._print("after parentEntry update");

    await this._packUpEntryToStarData(parentStar, parentEntry);

    this._logger.trace("_createNewStar: Done");

    return newStar.starId;
  };

  onDataChanged = async (star) => {
    // If this is one of our constellation type stars, we must fetch the data and update our tree.
    // Otherwise, notify the application of the data change.
    if (!this._isConstellation(star)) {
      this._logger.trace(
        `onDataChanged: star '${star.starId}' is not a constellation type`,
      );
      await this._handler.onDataChanged(star.starId);
      return;
    }

    this._logger.trace(
      `onDataChanged: star '${star.starId}' is a constellation type. Updating...`,
    );
    const entry = this._findEntryByStarId(this._root, star.starId);
    if (!entry) {
      this._logger.trace(
        `onDataChanged: no entry found for star '${star.starId}'`,
      );
      return;
    }

    await this._updateEntry(entry, star);

    this._print("after onDataChanged");
  };

  onPropertiesChanged = async (star) => {
    await this._handler.onPropertiesChanged(star.starId);
  };

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
          await oldEntry.star.disconnect();
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

  _findActiveStarByFullPath = (fullPath) => {
    const entry = this._findEntryByFullPath(fullPath);
    if (!entry) return;
    if (!entry.star) {
      this._logger.trace(
        `_findActiveStarByFullPath: Star at path '${fullPath}' is not active`,
      );
      return;
    }
    return entry.star;
  };

  _findEntryByPath = (here, path) => {
    for (const entry of here.entries) {
      if (entry.path == path) return entry;
    }
    this._logger.trace(`_findEntryByPath: Unable to find path '${path}'`);
    return null;
  };

  _packUpEntryToStarData = async (parentStar, parentEntry) => {
    // pack up the parentEntry and set it as data on the parentStar.
    this._logger.trace(
      "_packUpEntryToStarData: Updating constellation star data...",
    );
    const parentData = JSON.stringify(this._mapToStarData(parentEntry));

    await parentStar.setData(parentData);

    // Normally, we would expect the onDataChanged handler to fire
    // in response so our call to setData, and it would raise the onPathsChanged event.
    // BUT, we manually updated the local structure. So the handler won't spot any differences
    // and won't raise the event.
    // So we do this here:
    await this._raisePathsChangedEvent(parentStar.starId);
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

  _mapToStarData = (entry) => {
    var result = [];
    for (const e of entry.entries) {
      result.push({
        path: e.path,
        starId: e.starId,
      });
    }
    return result;
  };

  __getIndent = (indent) => {
    var result = "";
    for (var i = 0; i < indent; i++) result = result + "  ";
    return result;
  };

  _print = (msg) => {
    // console.log(" ");
    // console.log("print: " + msg);
    // this._debugPrintStructure(this._root, 1);
  };

  _debugPrintStructure = (here, indent) => {
    const id = this.__getIndent(indent);
    console.log(`${id} starId: '${here.starId}'`);
    console.log(`${id} path: '${here.path}'`);
    console.log(`${id} isActive: '${here.star != null}'`);
    console.log(`${id} entries: '${here.entries.length}'`);
    for (const e of here.entries) {
      this._debugPrintStructure(e, indent + 1);
    }
  };
}
