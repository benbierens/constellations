export class Logger {
  constructor(tag = "") {
    this.tag = tag;
  }

  trace = (msg) => {
    console.log(`[${new Date().toISOString()}]${this.tag} ${msg}`);
  };

  error = (msg) => {
    this.trace("ERROR: " + msg);
  };

  errorAndThrow = (msg) => {
    this.error(msg);
    throw new Error(msg);
  }

  assert = (msg) => {
    this.trace("FATAL: " + msg);
    console.assert(msg);
    die(msg);
  }

  prefix = (newTag) => {
    return new Logger(`${this.tag}(${newTag})`);
  }
}
