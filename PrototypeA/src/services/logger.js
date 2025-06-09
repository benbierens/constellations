export class Logger {
  trace = (msg) => {
    console.log(`[${new Date().toISOString()}] ${msg}`);
  };

  error = (msg) => {
    this.trace("ERROR: " + msg);
  };
}
