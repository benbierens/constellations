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
