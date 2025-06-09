import { Codex } from "@codex-storage/sdk-js";
import { NodeUploadStategy } from "@codex-storage/sdk-js/node";
import { BrowserUploadStrategy } from "@codex-storage/sdk-js/browser";

export class CodexService {
  constructor(logger, codexAddress) {
    this.logger = logger;
    this.codexAddress = codexAddress;
  }

  isOnline = async () => {
    try {
        const codex = new Codex(codexAddress);
        const debug = codex.debug;

        const info = await debug.info();
        if (info) {
          this.logger.trace("Codex online");
          return true;
        }
    }
    catch (error) {
      this.logger.error(error);
    }
    return false;
  }

  upload = async (data) => {
    if (this.isBrowser()) return this.uploadBrowser(data);
    if (this.isNode()) return this.uploadNode(data);
    throw new Error("Unknown environment");
  }

  uploadNode = async (fileData, filename = "unknown", mimetype = "application/octet-stream") => {
        const codex = new Codex(codexAddress);
    const data = codex.data;
    const metadata = { filename: filename, mimetype: mimetype };
    const strategy = new NodeUploadStategy(fileData, metadata);
    this.logger.trace("(Node) Uploading " + filename);
    const uploadResponse = data.upload(strategy);
    const res = await uploadResponse.result;
    if (res.error) {
      throw new Error(res.data);
    }
    this.logger.trace("Uploaded: " + filename + " => " + res.data);
    return res.data;
  }

  uploadNode = async (fileData, filename = "unknown", mimetype = "application/octet-stream") => {
        const codex = new Codex(codexAddress);
    const data = codex.data;
    const metadata = { filename: filename, mimetype: mimetype };
    const strategy = new BrowserUploadStrategy(fileData, null, metadata);
    this.logger.trace("(Browser) Uploading " + filename);
    const uploadResponse = data.upload(strategy);
    const res = await uploadResponse.result;
    if (res.error) {
      throw new Error(res.data);
    }
    this.logger.trace("Uploaded: " + filename + " => " + res.data);
    return res.data;
  }

  getManifest = async (cid) => {
        const codex = new Codex(codexAddress);
    const data = codex.data;
    const manifest = await data.fetchManifest(cid);
    return manifest.data.manifest;
  }

  fetchData = async (cid) => {
    const response = await data.networkDownload(cid);
    const result = await response.data.text();
    log("Fetching " + cid + " => " + result);
  }

  downloadData = async (cid) => {
    const response = await data.networkDownloadStream(cid);
    const result = await response.data.text();
    log("Downloading " + cid);
    return result;
  }

  isBrowser = () => {
    return
      typeof window !== "undefined" &&
      typeof window.document !== "undefined";
  }

  isNode = () => {
    return
      typeof process !== "undefined" &&
      process.versions != null &&
      process.versions.node != null;
  }
}
