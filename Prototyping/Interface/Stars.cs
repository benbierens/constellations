using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Prototyping.Interface
{
    public class Star
    {
        public Star(StarInfo info)
        {
            Info = info;
        }

        public StarInfo Info { get; }
        public StarProperties Properties { get; } = new();
        public StarStatistics Statistics { get; } = new();

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
            return null; // return star information if entry exists.
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

        public SubscriptionHandle SubscribeToMetastarChanges(MetaStarChangeHandler handler) { return new(); }

        public class MetaStarChangeHandler
        {
            public void OnMetastarChanged(string pathOfChange, StarInfo? updatedInfo) { }
        }

        #endregion
    }
}
