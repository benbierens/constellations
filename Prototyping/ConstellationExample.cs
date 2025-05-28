using Prototyping.Interface;

namespace Prototyping
{
    public class ConstellationExample
    {
        private readonly RequiredConfig config = new RequiredConfig();
        // This defines how to connect to waku and codex. It's always required.
        // Assume it's passed to the constellation code.

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
            var myRootNodeId = new ConstellationNodeId();


            // I'm writing a game-driver application that (in a decentralized way)
            // can control on-going changes to the user-generated content.
            // I'm running one myself, for now. Others can also run one. They'll reach consensus and modify
            // the user-generated content accordingly.
            // This is the nodeId of my game-driver instance:
            var myGameDriverNodeId = new ConstellationNodeId();


            // Turns out building a game is a lot of work
            // I needed a design team to build the 3D models, textures, and audio files.
            // We're a decentralized org and they can update the content of the game
            // without my involvement. They use this ID for this purpose:
            var gameDesignTeamNodeId = new ConstellationNodeId();
            // They have some students/interns that sometimes contribute:
            var gameDesignTeamInternsNodeId = new ConstellationNodeId();


            // Setting up the constellation:
            var constellationId = new ConstellationId();
            // This is the ID I will be sharing with everyone who wishes to support the game by
            // by hosting and syncing data for it!

            var constellationInfo = StarInfo.CreateNew(constellationId);
            constellationInfo.Owners = [myRootNodeId];
            constellationInfo.Type = "metaStar"; // Protocol defined

            var constellation = Constellation.CreateNew(constellationInfo);
            constellation.Properties.Status = StarStatus.Bright;
            constellation.Properties.Admins = [];
            constellation.Properties.Mods = [];


            // Let's split the game content and the user-generated content at this level.
            // Content metaStar:
            var gameContentMetaStarId = new StarId();
            var gameContentMetaStarInfo = StarInfo.CreateNew(gameContentMetaStarId);
            gameContentMetaStarInfo.Owners = [myRootNodeId]; // my root ID can modify this and cannot be removed.
            gameContentMetaStarInfo.Type = "metaStar"; // Protocol defined

            var gameContentMetaStar = new MetaStar(gameContentMetaStarInfo);
            gameContentMetaStar.Properties.Admins = [gameDesignTeamNodeId];
            gameContentMetaStar.Properties.Mods =[gameDesignTeamInternsNodeId];
            // This allows the design team and their interns to update their work at any time.
            // The design team can add/remove additional nodeIds in the admins array AND mods array, when team members join or leave.
            // If they mess up and delete themselves entirely (they're not very technical), I can use my rootNodeId to fix it.

            // Let's put it in the constellation:
            constellation.Put("/game/content", gameContentMetaStarInfo);


            // UserGen metaStar:
            var userGenMetaStarId = new StarId();
            var userGenMetaStarInfo = StarInfo.CreateNew(userGenMetaStarId);
            userGenMetaStarInfo.Owners = [myRootNodeId]; // if I really need to, I can always edit this.
            userGenMetaStarInfo.Type = "metaStar"; // Protocol defined

            var userGenMetaStar = new MetaStar(userGenMetaStarInfo);
            userGenMetaStar.Properties.Admins = [];
            userGenMetaStar.Properties.Mods = [myGameDriverNodeId];
            // My gameDriver app is authorized to modify this data automatically.
            // At some point, other people will be running the app too and I can enable them to modify user-generated content data
            // by updating the Mods array.
            // I do not set the Admins array, because I don't anticipate using my app to automatically give/revoke these permissions.

            // Let's put it:
            constellation.Put("/game/users", userGenMetaStarInfo);



            // The design team delivers their game content
            {
                // Repeat the code below for blocks, playerModels, enemyModels, vehicles, etc:
                var blocksInfo = StarInfo.CreateNew(new StarId());
                blocksInfo.Owners = [gameDesignTeamNodeId];
                blocksInfo.Type = "content_3dmodels_blocks"; // This is recognized by the game app so it knows how to handle the data.
                
                var blocks = new ContentStar(blocksInfo);
                blocks.Put(new ContentStar.DataSpan(), AnyData); // pushing the 3D models!

                // Putting this content in the constellation:
                constellation.Put("/game/content/models/blocks", blocks.Info);
            }



            // A player wants to create a new p2p-minecraft world to play with their friends.
            // they interact with the gameDriver app to accomplish this.
            // They run the game app. It contains a light-weight constellation node. These are their IDs:
            var player1 = new ConstellationNodeId(); // Wants to create a new game world
            // Their friends:
            var player2 = new ConstellationNodeId();
            var player3 = new ConstellationNodeId();

            // The gameDriver app(s) modify the user-generated content in this manner:
            {
                // We have a new game world!
                var worldInfo = StarInfo.CreateNew(new StarId());
                worldInfo.Owners = [myGameDriverNodeId];
                worldInfo.Type = "content_userGen_world"; // Recognized by the game app so it can interpret the world data.

                var world = new ContentStar(worldInfo);
                world.Properties.Admins = [player1];
                world.Properties.Mods = [player2, player3];
                // This allows the friends to make changes to the world state,
                // like when they mine blocks and then place them elsewhere.
                // But only player1 can invite/kick other players. He can promote others to admin as well.
                // How exactly they determine which player is allowed to make which changes to the world state is
                // something for the game to handle. It sounds like some consensus might be necessary, and the admins/mods lists need to be set differently.
                // Alternatively, the world-star could be meta as well, and each player has their own nested contentStar
                // that represents "their part" of the total world: a region in which they alone are allowed to modify stuff
                // either way: application-level concern.

                constellation.Put("/game/users/player1ID/new_world_name", world.Info);
            }


            // The friends are playing the game
            {
                // The game contains a light-weight constellation node to interface with the world data.
                // It communicates player1's ID and world name out of bounds.
                var worldInfo = constellation.Get("/game/users/player1ID/new_world_name")!;
                var world = new ContentStar(worldInfo);

                // During the game, the players modify the world state and are notified of changes.
                // (They modify the state of their game world without bothering any other stars in the constellation.)
                world.Put(new ContentStar.DataSpan(), AnyData);
                world.SubscribeToContentChanges(new ContentStar.ContentChangeHandler());
                // Warning: high-speed game data such as real-time player positions are handled out of bounds by common methods.
            }


            // It turns out player1 had a different game world they created months ago and forgot about.
            // People who are supporting the game constellation are storing this save game data for it, and that's a bit of a waste.
            // the gameDriver app detects this and (maybe after checking with player1?) decides to delete the old data:
            {
                var oldWorldInfo = constellation.Get("/game/users/player1ID/old_world_name")!;
                var oldWorld = new ContentStar(oldWorldInfo);
                oldWorld.Properties.Status = StarStatus.Cold;
                // Any constellation node monitoring this star will be notified of the changed property
                // and will understand that it can safely discontinue supporting this star.
                // There is no way to force a node to delete the data. Maybe they'll want to preserve it regardless,
                // but they have been notified that as far as the constellation is concerned, this one can be discarded.

                constellation.Remove("/game/users/player1ID/old_world_name");
                // this is done with the gameDriver id, which is not authorized to modify the constellation at top level.
                // but because of the metaStar traversal, this modification actually only affects the metaStar 
                // at "/game/users", for which the gameDriver is a mod!
            }
        }
    }
}
