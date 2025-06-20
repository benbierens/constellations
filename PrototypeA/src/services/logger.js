import fs from "fs";

var replacements = [];

export class NullLogger {
  trace = (msg) => {};

  warn = (msg) => {};

  error = (msg) => {};

  errorAndThrow = (msg) => {
    throw new Error(msg);
  };

  assert = (msg) => {
    console.assert(msg);
    die(msg);
  };

  prefix = (newTag) => {
    return this;
  };
}

export class Logger {
  constructor(tag = "") {
    this.tag = tag;
  }

  trace = (msg) => {
    msg = this._applyReplacements(msg);

    console.log(`[${new Date().toISOString()}]${this.tag} ${msg}`);

    if (this.filename) {
      fs.appendFileSync(this.filename, `${this.tag} ${msg}\n`);
    }
  };

  warn = (msg) => {
    this.trace("Warning: " + msg);
  };

  error = (msg) => {
    this.trace("ERROR: " + msg);
  };

  errorAndThrow = (msg) => {
    this.error(msg);
    throw new Error(msg);
  };

  assert = (msg) => {
    this.trace("FATAL: " + msg);
    console.assert(msg);
    die(msg);
  };

  prefix = (newTag) => {
    var result = new Logger(`${this.tag}(${newTag})`);
    if (this.filename) {
      result.filename = this.filename;
    }
    return result;
  };

  addReplacement = (from, to) => {
    this.trace(`Replacing '${from}' => '${to}'`);
    replacements.push({
      from: from,
      to: to,
    });
  };

  _applyReplacements = (msg) => {
    replacements.forEach((r) => {
      msg = msg.replaceAll(r.from, r.to);
    });
    return msg;
  };
}
