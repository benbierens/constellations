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

  getManifest = async (cid) => {
    return await this._returnManifest(cid);
  };

  fetchData = async (cid) => {
    return await this._returnManifest(cid);
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

  _returnManifest = async (cid) => {
    await this._core.sleep(1);
    for (var i = 0; i < this._data.length; i++) {
      const d = this._data[i];
      if (d.cid == cid)
        return {
          datasetSize: d.fileData.length,
        };
      await this._core.sleep(3);
    }
    throw new Error("mockCodex data not found.");
  };
}

export class MockWakuChannelForSender {
  constructor(mock, sender) {
    this._mock = mock;
    this._sender = sender;
  }

  start = async () => {
    await this._mock._start();
  };

  send = async (msg) => {
    await this._mock._send(this._sender, msg);
  };

  close = async () => {};
}

export class MockWakuChannel {
  constructor(handler) {
    this._handlers = [handler];
    this._messages = [];
  }

  _start = async () => {
    for (var i = 0; i < this._messages.length; i++) {
      const m = this._messages[i];
      await this._sendToAll(m.sender, m.msg);
      await this._core.sleep(5);
    }
  };

  _pushMessages = async (newHandler) => {
    this._handlers.push(newHandler);
  };

  _send = async (sender, msg) => {
    this._messages.push({
      sender: sender,
      msg: msg,
    });
    await this._sendToAll(sender, msg);
  };

  _sendToAll = async (sender, msg) => {
    for (var i = 0; i < this._handlers.length; i++) {
      await this._handlers[i].onMessage(sender, null, msg);
    }
  };
}

export class MockWakuServiceForSender {
  constructor(mockWakuService, sender) {
    this._mock = mockWakuService;
    this._sender = sender;
  }

  openChannel = async (contentTopic, handler, ephemeral = true) => {
    const channel = await this._mock._openChannel(
      contentTopic,
      handler,
      ephemeral,
    );

    return new MockWakuChannelForSender(channel, this._sender);
  };
}

export class MockWakuService {
  constructor() {
    this._channels = [];
  }

  _openChannel = async (contentTopic, handler, ephemeral = true) => {
    await this._core.sleep(1);

    for (var i = 0; i < this._channels.length; i++) {
      const c = this._channels[i];
      if (c.topic == contentTopic) {
        await this._core.sleep(1);
        await c.obj._pushMessages(handler);
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
