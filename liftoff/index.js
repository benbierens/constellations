import { AppData } from "./appdata.js";
import { Config } from "./config.js";
import { Logger } from "./logger.js";
import { Startup } from "./startup.js";

process.env["CONSTELLATIONS_ADDRESS"] = "placeholder";
process.env["CODEX_ADDRESS"] = "placeholder";
process.env["SOURCE_PATH"] = "placeholder";
process.env["DATA_PATH"] = "placeholder";

async function main() {
  const logger = new Logger();
  logger.log("Initializing...");

  const config = new Config(logger);
  const appData = new AppData(logger, config);

  await Startup(logger, config, appData);

  // iterate source path, make sure it's all update-to-date in the constellation.
  // iterate the constellation, make sure it's all update-to-date in the source path.
  // repeat until stopped.
}

main().catch(console.error); 
