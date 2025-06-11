export async function createNewStarExample(core) {
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

  const theData = "ThisIsTheData!";
  await star.setData(theData);

  const received = await star.getData();
  console.log("Getting the data: " + received);
}
