async function __sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class MockWaku {
  constructor() {
    this._allTopics = [];
    this._allChannels = [];
  }

  createMockWakuServiceForAddress = (address) => {
    return new MockWakuService(this, address);
  };

  deliverAll = async () => {
    for (const at of this._allChannels) {
      while (at._queue.length > 0) {
        await __sleep(1);
      }
    }
  };

  newChannel = (newChn) => {
    this._allChannels.push(newChn);
    for (const at of this._allTopics) {
      if (at.t == newChn._contentTopic) {
        for (const msgPack of at.history) {
          newChn._queue.push(msgPack);
        }
      }
    }
  };

  queueForAll = (topic, msgPack) => {
    for (const chn of this._allChannels) {
      if (chn._contentTopic == topic) {
        chn._queue.push(msgPack);
      }
    }

    for (const at of this._allTopics) {
      if (at.t == topic) {
        at.history.push(msgPack);
        return;
      }
    }

    this._allTopics.push({
      t: topic,
      history: [msgPack],
    });
  };
}

export class MockWakuService {
  constructor(mockWaku, address) {
    this._mockWaku = mockWaku;
    this._address = address;
  }

  openChannel = async (contentTopic, handler, ephemeral = true) => {
    return new MockWakuChannel(
      this._mockWaku,
      this._address,
      contentTopic,
      handler,
    );
  };
}

export class MockWakuChannel {
  constructor(mockWaku, address, contentTopic, handler) {
    this._mockWaku = mockWaku;
    this._address = address;
    this._contentTopic = contentTopic;
    this._handler = handler;

    this._queue = [];
    this._running = false;

    this._mockWaku.newChannel(this);
  }

  start = async () => {
    this._running = true;
    this.__worker();
  };

  send = async (msg) => {
    await __sleep(1);
    const msgPack = {
      signer: this._address,
      timestamp: new Date(),
      msg: msg,
    };

    this._mockWaku.queueForAll(this._contentTopic, msgPack);
  };

  close = async () => {
    this._queue = [];
    this._running = false;
  };

  __worker = async () => {
    while (this._running) {
      await __sleep(1);
      if (this._queue.length > 0) {
        const msgPack = this._queue.pop();
        const signer = msgPack.signer;
        const timestamp = msgPack.timestamp;
        const msg = msgPack.msg;
        await this._handler.onMessage(signer, timestamp, msg);
      }
    }
  };
}
