export async function connectStarExample(core, starId) {
  core.logger.trace("Watching star for 3 changes!");
  var counter = 3;

  const handler = {
    onDataChanged: async () => {
      counter--;
      core.logger.trace("(APPLICATION) data changed! counter: " + counter);
    },
  };
  const autoFetch = true; // Tells the star to automatically cache the data with its codex node.

  const star = await core.starFactory.connectToStar(starId, handler, autoFetch);

  while (counter > 0) {
    await core.sleep(1000);
  }

  await star.disconnect();
  core.logger.trace("Finished watching star!");
}
