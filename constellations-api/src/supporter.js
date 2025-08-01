export class Supporter {
  constructor(logger, app, config) {
    this._logger = logger.prefix("Supporter");
    this._app = app;
    this._config = config;
  }

  initialize = async () => {
    this._logger.trace("initing!");
  }

  addSupport = async () => {
this._logger.trace("add!");
  }

  removeSupport = async () => {
this._logger.trace("remove!");
  }
}