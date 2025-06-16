export async function createNewStarExample(core) {
  core.logger.trace("Creating star. Then sending 5000 changes!");

  const owners = [core.constellationNode.address];
  const type = "starType-example";
  const handler = {
    onDataChanged: async (star) => {
      core.logger.trace("(APPLICATION) data changed!");
    },
  };
  const star = await core.starFactory.createNewStar(type, owners, handler);

  core.logger.trace(`Star is created. starId: '${star.starId}'`);
  await core.sleep(10000);

  core.logger.trace(`Starting in 10 seconds.`);
  await core.sleep(10000);

  for (var i = 0; i < 5000; i++) {
    await core.sleep(3000);

    const theData = `ThisIsTheData: ${i}`;
    await star.setData(theData);

    await core.sleep(10000);

    const received = await star.getData();
    console.log("Getting the data: " + received);
  }

  await core.sleep(3000);
  await star.disconnect();
  core.logger.trace("Finished sending data to star!");
}
