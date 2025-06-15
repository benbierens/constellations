import { starIdToContentTopic } from "./protocol.js";
import { StarChannel } from "./starChannel.js";

export class StarChannelFactory {
  constructor(core) {
    this.core = core;
    this.logger = this.core.logger.prefix("StarChannelFactory");
  }

  createById = async (starId) => {
    const result = new StarChannel(this.core, starId);
    this.logger.trace(`createById: Channel created.`);
    return result;
  };
}
