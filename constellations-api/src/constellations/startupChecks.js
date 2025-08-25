export class StartupChecks {
  constructor(core) {
    this._core = core;
    this._logger = this._core.logger.prefix("StartupChecks");
  }

  performChecks = async () => {
    try {
      this._logger.trace("Checking Codex...");
      await this._checkCodex();

      this._logger.trace("Checking Waku...");
      await this._checkWaku();
    }
    catch (error) {
      this._logger.errorAndThrow("Startup check failed: " + error);
    }
    this._logger.trace("Checks passed.");
  }

  _checkCodex = async () => {
    await this._core.codexService.isOnline();

    const data = `CodexCheck:${Math.random() * 9999999}:${new Date().toISOString()}`;
    const cid = await this._core.codexService.upload(data);
    const response = await this._core.codexService.downloadData(cid);

    if (data == response) {
      this._logger.trace("Codex is online");
      return;
    }

    this._logger.errorAndThrow("Codex check failed.");
  }

  _checkWaku = async () => {
    var messages = [];
    const handler = {
      onMessage: async (signer, timestamp, msg) => {
        messages.push(msg);
      },
    };

    const contentTopic = "/constellations/0/startupchecks/json";
    const channel = await this._core.wakuService.openChannel(contentTopic, handler);
    await channel.start();

    const msg = `WakuCheck:${Math.random() * 9999999}:${new Date().toISOString()}`;
    await channel.send(msg);

    var counter = 10;
    while (true) {
      await this._core.sleep(1000);
      counter--;

      if (messages.includes(msg)) {
        this._logger.trace("Waku is online");
        await channel.close();
        return;
      }

      if (counter < 1) {
        await channel.close();
        this._logger.errorAndThrow("Waku connection failed.");
      }
    }
  }
}


