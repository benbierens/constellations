using static Prototyping.ContentStar;

namespace Prototyping
{
    // A constellation-node will expose an interface
    // that other apps can use to interact with stars and constellations.
    // Some apps will be reading/writing data, and following updates. (using)
    // Other apps will be only follwing and caching updates. (supporting)
    // The interface should cover all use cases.

    public class RequiredConfig
    {
        public string WakuConnectionInfo = string.Empty;
        public string CodexConnectionInfo = string.Empty;
    }

    public class ConstellationNodeId
    {
        public string PublicKey = "public-key";
        private string PrivateKey = "I can use this to sign messages";
    }

    public class StarId
    {
        public string Id = "UniqueIdentifier + hash of starInfo.type + owners?";
        public string WakuContentTopic => IdAsContentTopic();

        private string IdAsContentTopic()
        {
            // something like
            return $"constellations/v0/{Id}";
        }
    }

    public class StarInfo
    {
        public StarInfo(StarId id)
        {
            Id = id;
        }

        // Cannot change after creation:
        public StarId Id { get; }
        public string Type { get; set; } = string.Empty; // Inmutable application-specific metadata. Max sized.
        public ConstellationNodeId[] Owners { get; set; } = new ConstellationNodeId[0];
    }

    public class StarProperties
    {
        // Can be changed by owners and admins:
        public StarStatus Status { get; set; }
        public ConstellationNodeId[] Admins { get; set; } = [];
        public ConstellationNodeId[] Mods{ get; set; } = [];
        public string Annotations { get; set; } = string.Empty; // Mutable application-specific metadata. Max sized.
    }

    public enum StarStatus
    {
        Unknown,    // Uninitialized
        Bright,     // Star is alive. (sub)content is relevant. Support is wanted.
        Cold        // Star is gone. (sub)content is no longer relevant. Support may be discontinued.
    }

    public abstract class Star
    {
        public Star(StarInfo info)
        {
            Info = info;
        }

        public StarInfo Info { get; }
        public StarProperties Properties { get; } = new();

        #region Changes

        public void UpdateStarProperties(StarProperties properties)
        {
            // Owners and Admins are able to edit properties.

            // If no owners or admins are specified, then the admins and mods arrays must always be empty and cannot be changed:
            // AKA: one cannot assign control over an un-owned star.

            // If no owners or admins are specified, then status cannot be set to anything other than Bright:
            // AKA: one cannot show up and mark an un-owned star for deletion.
            
            // Interesting scenario:
            // - I create a star with no owners, but 1 admin which is me.
            // - Only I can update the data and properties.
            // - Some time later, I update the properties and remove myself from the admin list.
            // - The star now has no owner, no admins, therefore the mods list must be empty.
            // - The star can now be modified by anyone. I "gave it" to everyone.
            // - This can't be undone.
        }

        public SubscriptionHandle SubscribeToPropertiesChanges(PropertiesChangeHandler handler) { return new(); }
        public void Unsubscribe(SubscriptionHandle handle) { }

        public class PropertiesChangeHandler
        {
            public void OnPropertiesChanged(StarProperties @new) { }
        }

        #endregion
    }

    public class ContentStar : Star
    {
        public ContentStar(StarInfo info) : base(info)
        {
            info.Type = "Application specific contentType. Example: tarred_photos";
        }

        #region Data

        // Place data. Could be overwriting existing data.
        // byte[] data has a known length. We could be replacing a segment of data
        // of size span.Length with a larger or smaller segment of data.
        // Only owners, admins, or mods can modify the data.
        // If there are none, anyone can modify the data.
        public void Put(DataSpan span, byte[] data) { }

        // Access data, either blocking or streaming.
        // If span.Length == 0: everything after span.Offset!
        public byte[] Get(DataSpan span) { return []; }
        public void Get(DataSpan span, DataSink sink) { }

        public class DataSpan
        {
            public int Offset;
            public int Length;
        }

        public class DataSink
        {
            public void HandleData(int offset, byte[] data) { }
        }

        #endregion

        #region Changes

        public SubscriptionHandle SubscribeToContentChanges(ContentChangeHandler handler) { return new(); }
        public void Unsubscribe(SubscriptionHandle handle) { }

        public class ContentChangeHandler
        {
            public void OnContentChanged(DataSpan old, DataSpan @new) { }
        }

        #endregion
    }

    public class MetaStar : Star
    {
        public MetaStar(StarInfo info) : base(info)
        {
            info.Type = "MetaStar"; // protocol defined. not editable.
        }

        #region Stars

        public StarInfo? Get(string path)
        {
            path = "/example/path/to/content/star";
            return null; // return star information
        }

        public void Put(string path, StarInfo starInfo)
        {
            // puts an update in the datastructure to publish the information of the new star
            // Only owners, admins, or mods can modify the entries.
            // If there are none, anyone can modify the entries.
        }

        public void Remove(string path)
        {
        }

        #endregion

        #region Changes

        public SubscriptionHandle SubscribeToMetastarChanges(MetaChangeHandler handler) { return new(); }
        public void Unsubscribe(SubscriptionHandle handle) { }

        public class MetaChangeHandler
        {
            public void OnMetastarChanged(string pathOfChange, StarInfo? updatedInfo) { }
        }

        #endregion
    }

    public class ConstellationId : StarId { }

    public class Constellation
    {
        // Basically, a constellation is just a wrapper around a metaStar.
        private readonly MetaStar topLevelMetaStar;

        public static Constellation CreateNew(StarInfo info)
        {
            // When setting up a new constellation, the info
            // for the top-level metaStar must be provided.
            return new Constellation(info);
        }

        public static Constellation CreateToSupport(ConstellationId id)
        {
            // When trying to follow/support a constellation
            // you only need the id.
            return new Constellation(id);
        }

        public Constellation(StarInfo info)
        {
            topLevelMetaStar = new MetaStar(info);
        }

        private Constellation(ConstellationId id)
        {
            var fetchedStarInfo = new StarInfo(id); // fetched using ID.
            topLevelMetaStar = new MetaStar(fetchedStarInfo);
        }

        public StarProperties Properties => topLevelMetaStar.Properties;

        public StarInfo? Get(string path)
        {
            // we ask the top-level metaStar for this path.
            // maybe, part of the path points us to another metaStar, for example:
            // path = "/game/content/models/vehicles"
            // the top-level metaStar only has an entry for "/game/content",
            // we fetch it, it's another metaStar.
            // we ask it for "/models/vehicles" and it returns a contentStar info.
            return null;
        }

        public string[] List(string path)
        {
            // Lists all paths immediately under the given path.
            // example:
            // path = "/game/content"
            // result = ["/game/content/models", "/game/content/audio", "game/content/scripts"]
            // any of these paths may contain any number of multiple sub-paths. Those are not returned.

            return [];
        }

        public void Put(string path, StarInfo star)
        {
            // Following the same logic, we put the star info into the correct metaStar
        }

        public void Remove(string path)
        {
            // Again, traverse the metaStars where needed.
        }
    }

    public class SubscriptionHandle { }
}
