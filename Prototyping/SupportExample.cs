using Prototyping.Interface;

namespace Prototyping
{
    public class SupportExample
    {
        private readonly RequiredConfig config = new RequiredConfig();
        // This defines how to connect to waku and codex. It's always required.
        // Assume it's passed to the constellation code.

        /// <summary>
        /// This is to demonstrate how a person can contribute to maintaining a constellation.
        /// </summary>
        public void Example()
        {
            // [!!] Read ConstellationExample.cs first.
            // This continues the story of our p2p-game and the friends who are playing it.


            var constellationId = new ConstellationId();
            // This is the constellationId of our p2p game.


            // Turns out player2 really enjoys the game and wants to support it in a general sense.
            // They have an old computer they can set up as a server, so they configure it to support
            // the game's constellation.

            // They run a generic constellation-supporting app and provide it the constellationId of the game.
            // Inside that app:
            {
                var constellation = Constellation.CreateToSupport(constellationId);

                // I traverse all the paths. This gives me a list of all the stars in the constellation.
                var paths = constellation.List("/");
                // I re-traverse the paths once every 24h? or maybe, whenever one of the metaStars raises a changed event.

                // For every star, I look at the numbers:
                {
                    var vehicleModelsStar = new Star(constellation.Get("/game/content/models/vehicles")!);

                    var dataSize = vehicleModelsStar.Statistics.Size;
                    // Need to know this later.

                    var dataCount = vehicleModelsStar.Statistics.Health.DataCount;
                    // Number of nodes who claim to have stored the latest snapshot.
                    var topicCount = vehicleModelsStar.Statistics.Health.TopicCount;
                    // Number of nodes who claim to be listening/supporting the content topic channel.
                    // Distrust both of these numbers. Assume 1/3 is unreliable, so multiply by 2/3 and proceed from there.
                }

                // I select a few stars based on:
                // - How large is their data VS how much capacity to I have to give.
                // - How healthy are they. I will try and support the least healthy ones.
                var selectedStars = new Star[3];

                // For each of these, I will monitor the channels and fetch the snapshots.
                // The other channels, I exit.
                foreach (var star in selectedStars)
                {
                    star.SubscribeToPropertiesChanges(new Star.PropertiesChangeHandler());
                    // Keep track of properties like status, admins, and mods.

                    if (star is ContentStar contentStar)
                    {
                        contentStar.SubscribeToContentChanges(new ContentStar.ContentChangeHandler());
                        // Keep on top of content changes.
                    }
                    if (star is MetaStar metaStar)
                    {
                        metaStar.SubscribeToMetastarChanges(new MetaStar.MetaStarChangeHandler());
                        // This might be a useful trigger to re-traverse (part of) the star graph.
                    }
                }

                // After each re-traversal, I re-check the health numbers and I modify my list of
                // selected stars accordingly.
            }


            // Our friend player1 is a little more tech-savvy. They wants to support only their own saved game world.
            // They wrote an app that does the following:
            {
                var constellation = Constellation.CreateToSupport(constellationId);

                var worldInfo = constellation.Get("/game/users/player1ID/new_world_name")!;
                var world = new ContentStar(worldInfo);

                // subscribe to changes. Make sure to fetch all the data.
                world.SubscribeToContentChanges(new ContentStar.ContentChangeHandler());
                // Monitor the channel and fetch the snapshots.
            }
        }
    }
}
