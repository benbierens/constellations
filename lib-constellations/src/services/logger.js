import fs from "fs";

var replacements = [];

const ignore = [
  // "Column",
  // "CidTracker",
  // "StarChannel",
  // "StarFactory",
  // "StarChannelFactory",
  // "Health",
  // "TimerService",
  // "Timer",
  // "StarInternal"
];

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

  addReplacement = (from, to) => {};
}

export class Logger {
  constructor(tag = "") {
    this.tag = tag;
  }

  trace = (msg) => {
    for (const i of ignore) {
      if (this.tag.includes(i)) return;
    }
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

export class SinkLogger {
  constructor(sink, tag = "") {
    this._sink = sink;
    this.tag = tag;
  }

  trace = (msg) => {
    for (const i of ignore) {
      if (this.tag.includes(i)) return;
    }
    msg = this._applyReplacements(msg);
    this._sink.std(msg);
  };

  warn = (msg) => {
    this.trace("Warning: " + msg);
  };

  error = (msg) => {
    this._sink.err("ERROR: " + msg);
  };

  errorAndThrow = (msg) => {
    this.error(msg);
    throw new Error(msg);
  };

  assert = (msg) => {
    this.error("FATAL: " + msg);
    console.assert(msg);
    die(msg);
  };

  prefix = (newTag) => {
    var result = new SinkLogger(this._sink, `${this.tag}(${newTag})`);
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
