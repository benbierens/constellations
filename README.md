# Constellations Prototype
- Decentralized
- Community owned
- Community supported
- Practical
- Virtual drives

## What?
It's a kind of decentralized filesystem. It makes it easy for users/apps to read and write data by organizing them into "constellations". Very importantly: It makes it easy for those who want to support a certain constellation to devote some hardware to it. It's really for the data of communities. It's ready to be built on top of by either use-facing applications directly, OR by other automated systems to manage their data.

## How?
Constellations is a protocol that rides on top of Codex and Waku. It figures out the structure of files and folders, who is allowed to make which changes, and how participating nodes can best apply their resources to support the content they most care about.

## API
[Open-API Specification](./constellations-api/openapi.yaml)
The API allows users to create and interact with files and folders in a virtual "Constellations drive".

## Telescope
It's a tool you can use to look at Constellations.
This quick-and-dirty UI project is intended to showcase the capabilities of Constellations would bring to any project using its API.

### Try it yourself
You can run the mocked version of a Constellations node + Telescope yourself pretty easily using docker.
- Clone this repository.
- Open a terminal.
- Go into: `./telescope/docker`
- Run: `docker-compose build`
- Then: `docker-compose up -d`
- Open your browser to: `http://localhost`

**Important:**
When you create a new constellation, the address of *your* constellation node must be one of the owners. You can include other owners (it's a comma-separated text field) but if your node is not an owner, then it will not be able to create and sign valid update messages for the constellation and creation will fail. So: When creating a constellation, always copy-paste your nodeAddress into the owners textbox.

Because this demo uses mocked instances of Waku and Codex, it isn't actually able to interact with Constellations not present on your local node. Making this possible and easy is work-in-progress.

## Support This!
Constellations as a project and protocol is looking for support!
Do you think this is a good idea? Please express your support any way you're comfortable with.
Some places where you can do this include:

Discord Servers:
- Logos: https://discord.com/invite/logosnetwork
- Waku: https://discord.gg/85SrA3a6
- Codex: https://discord.gg/codex-storage
