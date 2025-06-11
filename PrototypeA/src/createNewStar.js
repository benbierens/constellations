export async function createNewStarExample(core) {
  core.logger.trace("Creating star. Then sending 5 changes!");

  const owners = [core.constellationNode.address];
  const type = "starType-example";
  const handler = {
    onDataChanged: async () => {
      core.logger.trace(
        "(APPLICATION) data changed! todo, params to show details",
      );
    },
  };
  const autoFetch = true; // Tells the star to automatically cache the data with its codex node.

  const star = await core.starFactory.createNewStar(
    type,
    owners,
    handler,
    autoFetch,
  );

  core.logger.trace(`Star is created. starId: '${star.starInfo.starId}'`);

  for (var i = 0; i < 5; i++) {
    await core.sleep(3000);

    const theData = `ThisIsTheData: ${i}`;
    await star.setData(theData);

    await core.sleep(1000);

    const received = await star.getData();
    console.log("Getting the data: " + received);
  }

  await core.sleep(3000);
  await star.disconnect();
  core.logger.trace("Finished sending data to star!");
}
