import { starIdToContentTopic } from "./protocol.js";
import { StarChannel } from "./starChannel.js";

export class StarChannelFactory {
  constructor(core) {
    this.core = core;
    this.logger = this.core.logger.prefix("StarChannelFactory");
  }

  openById = async (starId, handler) => {
    const result = new StarChannel(this.core, starId, handler);
    const topic = starIdToContentTopic(starId);
    result.channel = await this.core.wakuService.openChannel(topic, result);

    const receivedInfo = await result.getStarInfo();
    if (!receivedInfo) {
      this.logger.errorAndThrow(
        `openById: Failed to open starChannel by id '${starId}'.`,
      );
    }

    this.logger.trace(`openById: Channel open.`);
    return result;
  };

  openByInfo = async (starInfo, handler) => {
    const result = new StarChannel(this.core, starInfo.starId, handler);
    const topic = starIdToContentTopic(starInfo.starId);
    result.channel = await this.core.wakuService.openChannel(topic, result);

    const receivedInfo = await result.getStarInfo();
    if (!receivedInfo) {
      this.logger.trace(`openByInfo: Channel provided no info. Sending it...`);
      await result.setStarInfo(starInfo);
    }

    this.logger.trace(`openByInfo: Channel open.`);
    return result;
  };
}
