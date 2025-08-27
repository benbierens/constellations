function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optionalEnvArray(name) {
  const value = process.env[name];
  if (!value) {
    return [];
  }
  return value.split(",");
}

export const appConfig = {
  useMocks: process.env["USE_MOCKS"] == "1",
  codexAddress: requireEnv("CODEX_ADDRESS"),
  privateKey: requireEnv("PRIVATE_KEY"),
  supportConstellations: optionalEnvArray("SUPPORT_CONSTELLATIONS")
};
