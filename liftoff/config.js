function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export class Config {
  constructor(logger) {
    this._logger = logger;

    this.constellationsAddress = requireEnv("CONSTELLATIONS_ADDRESS");
    this.codexAddress = requireEnv("CODEX_ADDRESS");
    this.sourcePath = requireEnv("SOURCE_PATH");
    this.dataPath = requireEnv("DATA_PATH");

    this._logger.log(
      `constellationsAddress="${this.constellationsAddress}"\n` +
      `codexAddress="${this.codexAddress}"\n`+
      `sourcePath="${this.sourcePath}"\n`+
      `dataPath="${this.dataPath}"\n`
    );
  }
}
