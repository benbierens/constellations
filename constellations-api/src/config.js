function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const appConfig = {
  wakuBootstrapNodes: requireEnv("WAKU_BOOTSTRAP_NODES").split(","),
  codexAddress: requireEnv("CODEX_ADDRESS"),
  privateKey: requireEnv("PRIVATE_KEY"),
};

