export async function connectStarExample(core, starId) {
  core.logger.trace("Watching star for changes!");
  var counter = 0;

  const handler = {
    onDataChanged: async (star) => {
      counter++;
      core.logger.trace("(APPLICATION) data changed! counter: " + counter);

      const received = await star.getData();
      console.log("Got data: " + received);
    },
  };
  const autoFetch = true; // Tells the star to automatically cache the data with its codex node.

  const star = await core.starFactory.connectToStar(starId, handler, autoFetch);

  core.logger.trace("Watching star quietly...");
  while (counter < 100) {
    await core.sleep(1000);
  }

  await star.disconnect();
  core.logger.trace("Finished watching star!");
}
