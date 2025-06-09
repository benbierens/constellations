export class Logger {
  trace = (msg) => {
    console.log(`[${new Date().toUTCString()}] ${msg}`);
  };
}
