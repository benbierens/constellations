export class MockCodexService {
  constructor() {
    this._counter = 0;
    this._data = [];
  }

  isOnline = async () => {
    return true;
  };

  upload = async (
    fileData,
    filename = "unknown",
    mimetype = "application/octet-stream",
  ) => {
    for (var i = 0; i < this._data.length; i++) {
      const d = this._data[i];
      if (
        d.fileData == fileData &&
        d.filename == filename &&
        d.mimetype == mimetype
      )
        return d.cid;
      await this._core.sleep(1);
    }
    await this._core.sleep(1);
    const cid = this._newCid();
    this._data.push({
      cid: cid,
      fileData: fileData,
      filename: filename,
      mimetype: mimetype,
    });
    return cid;
  };

  fetchData = async (cid) => {
    await this._core.sleep(1);
  };

  downloadData = async (cid) => {
    await this._core.sleep(5);
    for (var i = 0; i < this._data.length; i++) {
      const d = this._data[i];
      if (d.cid == cid) return d.fileData;
      await this._core.sleep(3);
    }
    throw new Error("mockCodex data not found.");
  };

  _newCid = () => {
    this._counter++;
    return `_mockcodexservice_cid_${this._counter}_`;
  };
}

export class MockWakuChannel {
  constructor(handler) {
    this._handlers = [handler];
    this._messages = [];
  }

  pushMessages = async (newHandler) => {
    this._handlers.push(newHandler);
    for (var i = 0; i < this._messages.length; i++) {
      const m = this._messages[i];
      await this.sendToAll(m);
      await this._core.sleep(5);
    }
  };

  send = async (msg) => {
    this._messages.push(msg);
    await this.sendToAll(msg);
  };

  close = async () => {};

  sendToAll = async (msg) => {
    for (var i = 0; i < this._handlers.length; i++) {
      await this._handlers[i].onMessage(null, null, msg);
    }
  };
}

export class MockWakuService {
  constructor() {
    this._channels = [];
  }

  openChannel = async (contentTopic, handler, ephemeral = true) => {
    await this._core.sleep(1);

    for (var i = 0; i < this._channels.length; i++) {
      const c = this._channels[i];
      if (c.topic == contentTopic) {
        await this._core.sleep(1);
        await c.obj.pushMessages(handler);
        return c.obj;
      }
      await this._core.sleep(1);
    }

    const newChannel = {
      topic: contentTopic,
      obj: new MockWakuChannel(handler),
    };
    newChannel.obj._core = this._core;
    this._channels.push(newChannel);
    await this._core.sleep(1);
    return newChannel.obj;
  };
}
