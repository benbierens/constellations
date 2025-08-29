# Constellations Protocol Spec
Version 1

## Key features
Constellations is a decentralized data storage protocol in which one or more nodes commit their local resources to the maintaining of a virtual filesystem volume. Such a volume is called a constellation. It contains a graph structure of folders and files, provides create/update time information, and has permission settings, like most common filesystem. These are its key features:

### Fine support control
A node can select down to the level of individual files and folders, whether its local resources should be used to maintain it or not.

### Automatic update dissemination
When changes to files and folders occur, nodes supporting those entries will automatically retrieve the updated data and maintain it.

### Simple health information
For each file and folder, a node is able to provide a metric for its health, measured in the total number of nodes committed to the maintenance of that file or folder.

### Semi-mutable permission
Each file and folder has individual permission settings indicating which nodes are allowed to broadcast modifications. The permission settings themselves are also (to an extent) mutable this way. Stewardship of data can be migrated between one or multiple nodes. Read permissions are not considered in this version of the protocol. It is assumed the data stored is either encrypted by the user application, or permits of public access.


## Requirements
Constellations is designed to operate on top of existing p2p protocols.
| Type | Description | Used in prototype |
|------|-------------|-------------------|
| Messaging | Fast, responsive sending and retrieving of small messages that are expected to exist only for a short duration. | Waku (https://github.com/vpavlin/waku-dispatcher)
| Storage | Data exchange and storage layer capable of handling large files. | Codex (https://github.com/codex-storage/nim-codex) |


## Assumptions
Constellations assumes that:
- Network participants will volunteer resources for the maintenance of data they are interested in
- The majority of network participants are honest
- The data exchange protocol is reliable
- Messages sent with the messaging protocol will be delivered more likely than not


## Star
Stars are the key objects of Constellations. It is the smallest unit at which the first key features of Constellations are available. A star represent a single mutable unit of data.
A star has:
- A unique, immutable identifier
- A messaging channel exclusive to itself
- Zero or one storage content identifiers (CID)
- Permission information
- Health information

### Immutable properties
When a star is created, the following information must be provided:
- Current UTC timestamp
- One or more public-keys of the owners of the star
- A string representing the type of the star

These values together are frequently represented as the "StarInfo" object. They are cannot be changed after creation. The hashing of the StarInfo object yields the star's unique identifier.

### Mutable properties
A star contains the following information that can be modified after creation.

#### Data
After creation, a star has no CID by default. Any of the star's owners or admins (described below) may sign and broadcast an update package (also described below) to announce a new CID.
Receivers of such a packet are able to verify that it is signed by an owner or admin, and so they will only accept updates signed by nodes permitted to modify the data.

#### Properties
A star has the following properties which may be updated by owners or admins.
| Name | Description |
|------|-------------|
| Admins | Any number of public-keys. Defines which nodes have the admin role. Admins are permitted to modify both a star's data and its properties. |
| Mods | Any number of public-keys. Defines which nodes have the mod role. Mods are permitted to modify a star's data, but not its properties. |
| Annotations | A string for application-specific annotations. |
| Status | Enum, either "Bright" or "Cold". Indicates whether support for this star is desired, or whether it can be discontinued. |

The properties also contain the following configuration values:
| Name | Description |
|------|-------------|
| maxDiffSize | When changes to a star's data are small, instead of generating and broadcasting a new CID, the author of the change may decide to broadcast a diff message instead, detailing how the bytes of the current CID are to be modified. The size of such a diff may not exceed this value. If it would, a new CID must be used instead. |
| softMinSnapshotDuration | After a new CID is broadcast, another one may not be broadcast for this length of time, unless not doing so would violate any of the previous configuration values. |
| softMaxDiffDuration | This long after the most recent diff message, the changes must be rolled up into a CID and broadcast, unless doing so would violate any of the previous configuration values. |
| softMaxNumDiffs | If more than this many unique diff messages are broadcast, the changes must be rolled up into a CID and broadcast, unless doing so would violate any of the previous configuration values. |
| channelMonitoringMinutes | The metric representing the health of the messaging channel is refreshed with this interval. |
| cidMonitoringMinutes | The metric representing the health of the CID is refreshed with this interval. |

These values together are frequently represented as the "StarProperties" object.

> Good to know: The current prototype does not implement any of the diff-message related functionality.
> The diff-message definitions are not part of this spec.

### Column packet definitions
Columns are the objects on which a Star object is built. Each column has the ability to:
- Request information using the message channel
- Receive and hold that information
- Re-transmit that information when a request is received, AND, (very importantly) retransmit it with the signature of the originator of the message.

A star contains three columns, one for each of StarInfo, StarProperties, and CID. These are their packet definitions.

#### StarInfo
When a star joins a channel and wants to know the StarInfo (because it wasn't received as part of the channel's cached messages), it sends this request:
```js
requestPacket = {
  header: "requestStarInfo"
}
```

Upon receiving the request packet, if it has the information, the StarInfo column responds with:
```js
responsePacket = {
  header: "responseStarInfo",
  signature: "<Signature over the signed data of originator of the StarInfo>",
  signedData: {
    utc: "<Timestamp when original packet was created>",
    payload: {
      type: "<String representing application-specific type information>",
      owners: ["<String-array of public-keys>"],
      creationUtc: "<UTC when star was created>"
    }
  }
}
```

#### StarProperties
When a star joins a channel and wants to know the StarProperties (because it wasn't received as part of the channel's cached messages), it sends this request:
```js
requestPacket = {
  header: "requestStarProperties"
}
```

Upon receiving the request packet, if it has the information, the StarProperties column responds with:
```js
responsePacket = {
  header: "responseStarProperties",
  signature: "<Signature over the signed data of originator of the StarProperties>",
  signedData: {
    utc: "<Timestamp when original packet was created>",
    payload: {
      status: "<Bright or Cold>",
      admins: ["<String-array of public-keys>"],
      mods: ["<String-array of public-keys>"],
      annotations: "<String>",
      configuration: {
        maxDiffSize: "<Number of bytes>",
        softMinSnapshotDuration: "<Number of seconds>",
        softMaxDiffDuration: "<Number of seconds>",
        softMaxNumDiffs: "<Number of diffs>",
        channelMonitoringMinutes: "<Number of minutes>",
        cidMonitoringMinutes: "<Number of minutes>",
      }
    }
  }
}
```

#### CID
When a star joins a channel and wants to know the current CID (because it wasn't received as part of the channel's cached messages), it sends this request:
```js
requestPacket = {
  header: "requestCdxCid"
}
```

Upon receiving the request packet, if it has the information, the StarProperties column responds with:
```js
responsePacket = {
  header: "responseCdxCid",
  signature: "<Signature over the signed data of originator of the CID packet>",
  signedData: {
    utc: "<Timestamp when original packet was created>",
    payload: "<CID>"
  }
}
```

#### Delayed initialization
The column objects have one additional important property: They can be used to cache packets and replay them later. This is needed when initialization packets are received out of order. For example:
1. A CID response message is received.
1. The StarInfo and StarProperties are not received yet. So the owners/admins are not known yet.
1. The CID message cannot be confirmed at this time. It is cached.
1. Some time later, StarInfo and StarProperties have been received.
1. The cached CID message is replayed and applied or discarded.

Even when the messaging channel protocol guarantees that messages will be received in the correct order, it remains possible that crucial messages are missing simply because they were broadcast too long ago.

### Health packet definitions
The measuring of a star's health consists of both channel-health and CID-health. Each are represented by two numbers, "previous" and "current". Previous equals the number of unique health packets received during the previous cycle. Current equals the number received during the current one, so it may be incomplete.

A health metric cycle takes a fixed length of time. During that time, each node supporting the star in question will send at least 1 health message, to let others know it is there and commited to the maintenance of the star.

#### Channel health
During the channel health cycle, a node will send:
```js
healthPacket = {
  header: "hChn"
}
```
Receiving nodes will use the message sender to track uniqueness of these messages. Unlike the column packets, these cannot be retransmitted.

#### CID health
During the CID health cycle, a node will send:
```js
healthPacket = {
  header: "hCid",
  payload: "<CID>"
}
```
Receiving nodes will verify that the CID is (as far as they know) the current CID for this star, and then track the number of unique senders. Again, these packets cannot be transmitted on behalf of anyone else.

## Constellation
Now that we have a star (a unit of mutable data with health information and permission settings, that has a unique ID and can synchronize itself across multiple nodes), it's fairly straightforward how to build a graph structure on top.

A constellation is then simply a star with its immutable type value set to a protocol-defined constant, and its data following a protocol-defined structure.

Constellation star type: `"_constellation"`.

Constellation star data structure:
```js
const structure = [
  {
    "starId": "<Star ID>",
    "path": "<Single path element>"
  },
  ...
]
```

A graph can be built when the star ID references another star object that is also a constellation type.

Paths in Constellations are represented as string-arrays. Yet the data structure allows for only single strings. This means that in order to travers a lengthy path, one will be encountering a chain of stars before arriving at the desired data.

Additionally, it's good to keep in mind that any constellation type star can be mounted as if it is a root. This allows user applications to easily select a desired scope for its interaction with the graph.

### Resources, limitations, and ideas for the future
#### Sharing of messaging channels
If we imagine a constellation which contains over 100 files and folders, it's easy to see how a dedicated messaging channel is perhaps unnecessarily wasteful. It admits of the greatest possible flexability in health information, access control, and interaction. But in many usecases, this flexibility will be an acceptable trade-off. For example, imagine a constellation which contains archival files which never change. If all their health and permission information were somehow routed through the messaging channel of the folder that contains them, this could save a lot of overhead.

Allowing users to specify (and update?) the expected size range and change frequency of stars would allow future versions of the protocol to automatically choose when and how to use its messaging channels.

#### Diffs
Additionally, while diffs are partially specced above, they were never implemented in the prototype. Without a doubt valuable practical lessons remain to be encountered down this development route. In their original conception, diffs would be kept in-memory or some node-restart-resistent cache. When data is accessed through the Constellations implementation, it would consider the known diffs and apply them on-the-fly as the raw bytes are streamed to the user application. The reverse, (comparing updated against original data in order to generate diffs and/or deciding whether to simply use a new CID) is without a doubt a far larger design space that's yet to be explored here.
