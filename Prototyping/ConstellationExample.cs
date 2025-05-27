namespace Prototyping
{
    public class ConstellationExample
    {
        private readonly byte[] AnyData = new byte[1];

        /// <summary>
        /// This is to demonstrate the versatility of constellations.
        /// </summary>
        public void Example()
        {
            // I'm running a constellation node.
            // I'm publishing a game! p2p-minecraft.
            // It's got game content: 3D models, textures, and audio files.
            // It's got user-generated content: save-game worlds, and a scoreboard.

            // I have a root-level identity that I will protect with my life:
            var myRootNodeId = new NodeId();


            // I'm writing a game-driver application that (in a decentralized way)
            // can control on-going changes to the user-generated content.
            // I'm running one myself, for now. Others can also run one. They'll reach consensus and modify
            // the user-generated content accordingly.
            // This is the nodeId of my game-driver instance:
            var myGameDriverNodeId = new NodeId();


            // Turns out building a game is a lot of work
            // I needed a design team to build the 3D models, textures, and audio files.
            // We're a decentralized org and they can update the content of the game
            // without my involvement. They use this ID for this purpose:
            var gameDesignTeamNodeId = new NodeId();


            // Setting up the constellation:
            var constellationId = new ConstellationId();
            // This is the ID I will be sharing with everyone who wishes to support the game by
            // by hosting and syncing data for it!

            var constellationInfo = new StarInfo(constellationId)
            {
                Owners = [myRootNodeId],
                Type = "metaStar" // Protocol defined
            };
            var constellation = Constellation.CreateNew(constellationInfo);
            constellation.Properties.Status = StarStatus.Bright;
            constellation.Properties.Controllers = [];


            // Let's split the game content and the user-generated content at this level.
            // Content metaStar:
            var contentMetaStarId = new StarId();
            var contentMetaStarInfo = new StarInfo(contentMetaStarId)
            {
                Owners = [myRootNodeId], // my root ID can modify this and cannot be removed.
                Type = "metaStar"
            };
            var contentMetaStar = new MetaStar(contentMetaStarInfo);
            contentMetaStar.Properties.Controllers = [gameDesignTeamNodeId];
            // This allows the design team to update their work at any time.
            // They can even add/remove additional nodeIds in the controllers array, when team members join or leave.
            // If they mess up and delete themselves entirely (they're not very technical), I can use my rootNodeId to fix it.

            // Let's put it in the constellation:
            constellation.Put("/game/content", contentMetaStarInfo);


            // UserGen metaStar:
            var userGenMetaStarId = new StarId();
            var userGenMetaStarInfo = new StarInfo(userGenMetaStarId)
            {
                Owners = [myRootNodeId], // if I really need to, I can always edit this.
                Type = "metaStar"
            };
            var userGenMetaStar = new MetaStar(userGenMetaStarInfo);
            userGenMetaStar.Properties.Controllers = [myGameDriverNodeId];
            // My gameDriver app is authorized to modify this thing automatically.
            // At some point, other people will be running the app too and I can enable them to modify user-generated content data
            // by updating this array.

            // Let's put it:
            constellation.Put("/game/users", userGenMetaStarInfo);



            // The design team delivers their game content
            {
                // Repeat below for blocks, playerModels, enemyModels, and vehicles
                var blocks = new ContentStar(new StarInfo(new StarId())
                {
                    Owners = [gameDesignTeamNodeId],
                    Type = "content_3dmodels_blocks"
                });
                blocks.Put(new ContentStar.DataSpan(), AnyData); // pushing the 3D models!

                // Putting this content in the constellation:
                constellation.Put("/game/content/models/blocks", blocks.Info);
            }



            // A player wants to create a new p2p-minecraft world to play with their friends.
            // they interact with the gameDriver app to accomplish this. These are their IDs:
            var player1 = new NodeId(); // Created the new game world
            // Their friends:
            var player2 = new NodeId();
            var player3 = new NodeId();

            // The gameDriver app(s) modify the user-generated content in this manner:
            {
                // We have a new game world!
                var world = new ContentStar(new StarInfo(new StarId())
                {
                    Owners = [player1],
                    Type = "content_userGen_world"
                });
                world.Properties.Controllers = [player2, player3];
                // This allows the friends to make changes to the world state,
                // like when they mine blocks and then place them elsewhere.

                constellation.Put("/game/users/player1ID/new_world_name", world.Info);
            }


            // The friends are playing the game
            {
                // The game contains a light-weight constellation node to interface with the world data.
                // It communicates player1's ID and world name out of bounds.
                var worldInfo = constellation.Get("/game/users/player1ID/new_world_name")!;
                var world = new ContentStar(worldInfo);

                // During the game, the players modify the world state and are notified of changes.
                // (They modify the state of their game world without bothering any other star in the constellation.)
                world.Put(new ContentStar.DataSpan(), AnyData);
                world.SubscribeToContentChanges(new ContentStar.ContentChangeHandler());
                // Warning: high-speed game data such as real-time player positions are handled out of bounds by common methods.
            }


            // Turns out player2 really enjoys the game and wants to support it in a general sense.
            // They have an old computer they can set up as a server, so they configure it to support
            // the game's constellation:
            {
                // They run a generic constellation-supporter app and provide it the id of the game.
                // Inside that app:
                var supporter = Constellation.CreateToSupport(constellationId);
                // todo quality measures!
                // todo stars: begin support / discontinue support
            }

            // Our friend player1 is a little more tech-savvy. He wants to support only his saved game world:
            {
                // He wrote an app that does the following:
                var worldInfo = constellation.Get("/game/users/player1ID/new_world_name")!;
                var world = new ContentStar(worldInfo);

                // subscribe to changes. Make sure to fetch all the data.
                world.SubscribeToContentChanges(new ContentStar.ContentChangeHandler());
            }
        }
    }
}
