import { AppData } from "./appdata.js";
import { Config } from "./config.js";
import { Logger } from "./logger.js";

process.env["CONSTELLATIONS_ADDRESS"] = "placeholder";
process.env["CODEX_ADDRESS"] = "placeholder";
process.env["SOURCE_PATH"] = "placeholder";
process.env["DATA_PATH"] = "placeholder";

const logger = new Logger();
logger.log("Initializing...");

const config = new Config(logger);
const appData = new AppData(logger, config);

// if no constellation ID, create new constellation and save it.

// iterate source path, make sure it's all update-to-date in the constellation.
// iterate the constellation, make sure it's all update-to-date in the source path.
// repeat until stopped.
