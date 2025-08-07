import 'fs';
import { readFileSync, writeFileSync } from 'fs';

const filename = "liftoff_data.json";

export class AppData {
  constructor(logger, config) {
    this._logger = logger;
    this._config = config;
  }

  get constellationId() {
    const data = this._getData();
    if (data) return data.constellationId;
    return null;
  }

  setConstellationId(id) {
    try {
      writeFileSync(filename, JSON.stringify({
        constellationId: id
      }));
    }
    catch (error) {
      this._logger.log(error);
      throw error;
    }
  }

  _getData() {
    try {
      const buffer = readFileSync(filename)
      return JSON.parse(buffer);
    }
    catch (error) {
      this._logger.log(error);
      throw error;
    }
  }
}
