import { Codex } from "@codex-storage/sdk-js";
import { NodeUploadStrategy } from "@codex-storage/sdk-js/node";
import { BrowserUploadStrategy } from "@codex-storage/sdk-js/browser";

export class CodexService {
  constructor(logger, codexAddress) {
    this.logger = logger.prefix("Codex");
    this.codexAddress = codexAddress;
  }

  isOnline = async () => {
    try {
      const codex = new Codex(this.codexAddress);
      const debug = codex.debug;

      const info = await debug.info();
      if (info) {
        this.logger.trace("Codex online");
        return true;
      }
    } catch (error) {
      this.logger.error(error);
    }
    return false;
  };

  upload = async (
    fileData,
    filename = "unknown",
    mimetype = "application/octet-stream",
  ) => {
    if (this.isBrowser())
      return this.uploadBrowser(fileData, filename, mimetype);
    if (this.isNode()) return this.uploadNode(fileData, filename, mimetype);
    throw new Error("Unknown environment");
  };

  uploadNode = async (fileData, filename, mimetype) => {
    const data = this.getData();
    const metadata = { filename: filename, mimetype: mimetype };
    const strategy = new NodeUploadStrategy(fileData, metadata);
    this.logger.trace(`(Node) Uploading '${filename}'`);
    const uploadResponse = data.upload(strategy);
    const res = await uploadResponse.result;
    if (res.error) {
      throw new Error(res.data);
    }
    this.logger.trace(`(Node) Uploaded '${filename}' => '${res.data}'`);
    return res.data;
  };

  uploadBrowser = async (fileData, filename, mimetype) => {
    const data = this.getData();
    const metadata = { filename: filename, mimetype: mimetype };
    const strategy = new BrowserUploadStrategy(fileData, null, metadata);
    this.logger.trace(`(Browser) Uploading '${filename}'`);
    const uploadResponse = data.upload(strategy);
    const res = await uploadResponse.result;
    if (res.error) {
      throw new Error(res.data);
    }
    this.logger.trace(`(Browser) Uploaded '${filename}' => '${res.data}'`);
    return res.data;
  };

  getManifest = async (cid) => {
    const data = this.getData();
    const manifest = await data.fetchManifest(cid);
    return manifest.data.manifest;
  };

  fetchData = async (cid) => {
    const data = this.getData();
    const response = await data.networkDownload(cid);
    if (response.error) {
      throw new Error(response.data);
    }
    this.logger.trace(`Fetching '${cid}'`);
    return response.data.manifest;
  };

  downloadData = async (cid) => {
    const data = this.getData();
    const response = await data.networkDownloadStream(cid);
    if (response.error) {
      throw new Error(response.data);
    }
    const result = await response.data.text();
    this.logger.trace(`Downloaded '${cid}'`);
    return result;
  };

  isBrowser = () => {
    return (
      typeof window !== "undefined" && typeof window.document !== "undefined"
    );
  };

  isNode = () => {
    return (
      typeof process !== "undefined" &&
      process.versions != null &&
      process.versions.node != null
    );
  };

  getData = () => {
    const codex = new Codex(this.codexAddress);
    return codex.data;
  };
}
