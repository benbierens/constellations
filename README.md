# Constellations
Because screw clouds.

## What?
It's a kind of decentralized filesystem. It makes it easy for users/apps to read and write data by organizing them into "constellations". Very importantly: It makes it easy for those who want to support a certain constellation to devote some hardware to its maintenance.

## How? (kinda)
We're using Codex and Waku.

## Interface prototype
A constellation-node will expose an interface that other apps can use to interact with stars and constellations. Some apps will be reading/writing data, and following updates. Other apps will be only following and caching updates. The interface covers all use cases. In general, the Constellation type will be the entry-point for most interactions.

## How to read?!
- Read the example files from top to bottom. They tell a little story.
- Read them in this order: ContentStarExample, ConstellationExample, then SupportExample.
- Consult the files in `/Interface` for clarification when you need it.
