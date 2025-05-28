using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Prototyping.Interface
{
    public class StarInfo
    {
        public static StarInfo CreateNew(StarId id)
        {
            return new StarInfo(id);
        }

        public static StarInfo FetchUsingId(StarId id)
        {
            // Convert id to content topic
            // find in message history or ask for starInfo data.
            // verify it against the id hash.
            return new StarInfo(id);
        }

        private StarInfo(StarId id)
        {
            Id = id;
        }

        // Cannot change after creation:
        public StarId Id { get; } // Not included in its own hashing, of course.
        public string Type { get; set; } = string.Empty; // Inmutable application-specific metadata. Max sized.
        public ConstellationNodeId[] Owners { get; set; } = [];
        public DateTime CreationUtc { get; set; }
    }

    public class StarProperties
    {
        // Can be changed by owners and admins:
        public StarStatus Status { get; set; }
        public StarConfiguration Configuration { get; set; } = new();
        public ConstellationNodeId[] Admins { get; set; } = [];
        public ConstellationNodeId[] Mods { get; set; } = [];
        public string Annotations { get; set; } = string.Empty; // Mutable application-specific metadata. Max sized.
    }

    public class StarConfiguration
    {
        // Diffs and snapshots
        public int MaxDiffSize { get; set; }
        // Size in bytes for how large a single diff can be. (determined by waku message size?)

        public TimeSpan SoftMinSnapshotDuration { get; set; }
        // After a snapshot was made and published, diffs cannot cause a new snapshot
        // to be created for at least this length of time. A user action that modified a segment of data too large to be captured in a diff
        // can disregard this restriction.

        public TimeSpan SoftMaxDiffDuration { get; set; }
        // If we have a diff older than this, snapshot if allowed by MinSnapshotDuration.

        public int SoftMaxNumDiffs { get; set; }
        // If we have more than this many diffs, snapshot if allowed by MinSnapshotDuration.

        // Health
        public TimeSpan TopicMonitoringMessagePeriod { get; set; }
        // Every this, send a message to let others know you're monitoring this topic.

        public TimeSpan TopicMonitoringMessageDuration { get; set; }
        // How long such messages are valid.
    }

    public enum StarStatus
    {
        Unknown,    // Uninitialized
        Bright,     // Star is alive. (sub)content is relevant. Support is wanted.
        Cold        // Star is gone. (sub)content is no longer relevant. Support may be discontinued.
    }

    public class StarStatistics
    {
        // Inferred, not editable:
        public DateTime LastChangedUtc { get; set; }
        public int Size { get; set; } // last CID size + changes resulting from diffs
        public StarHealth Health { get; set; } = new();
    }

    public class StarHealth
    {
        // Deliberately separated.
        // This is likely to change frequently and for reasons isolated to the topic of measuring star health.

        public int DataCount { get; set; }
        // Whenever a new snapshot is broadcast, nodes respond with a message to incidate when they have successfully
        // fetched the new dataset using their codex node. This counter shows how many nodes sent such a message
        // for the most recent snapshot.

        public int TopicCount { get; set; }
        // Periodically (StarConfig.TopicMonitoringMessagePeriod)
        // nodes send a message to indicate that they are monitoring this star's content topic. This indicates that
        // they are using their waku node to cache and relay messages for this topic. This counter shows how
        // many nodes sent such a message in the past (StarConfig.TopicMonitoringMessageDuration)
    }
}
