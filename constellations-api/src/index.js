import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import { App } from "./app.js";
import { appConfig } from "./config.js";

const websockMessages = {
  onConstellationsChanged: "constellationsChanged",
  onPathsChanged: "pathsChanged",
  onPropertiesChanged: "propertiesChanged",
  onDataChanged: "dataChanged",
};

class WebsocketCallbacks {
  constructor(wss) {
    this.clients = new Set();

    wss.on("connection", (ws) => {
      clients.add(ws);
      ws.on("close", () => {
        clients.delete(ws);
      });
    });
  }

  sendConstellationsChanged = () => {
    this._sendToAll(websockMessages.onConstellationsChanged);
  };

  sendPathsChanged = (id, starId) => {
    this._sendToAll(`${websockMessages.onPathsChanged}/${id}/${starId}`);
  };

  sendPropertiesChanged = (id, starId) => {
    this._sendToAll(`${websockMessages.onPropertiesChanged}/${id}/${starId}`);
  };

  sendDataChanged = (id, starId) => {
    this._sendToAll(`${websockMessages.onDataChanged}/${id}/${starId}`);
  };

  _sendToAll = (msg) => {
    for (const ws of clients) {
      if (ws.readyState === ws.OPEN) {
        ws.send(msg);
      }
    }
  };
}

function getId(req) {
  return parseInt(req.params.id, 10);
}

function getBody(req, res) {
  const body = req.body;
  if (!body || typeof body !== "object") {
    res.status(400).json({ error: "Request body must be a JSON object" });
    return null;
  }
  return body;
}

function getIdBody(req, res) {
  return {
    id: getId(req),
    body: getBody(req, res),
  };
}

export function main() {
  const web = express();
  const port = process.env.PORT || 3000;

  web.use(express.json());

  // Create HTTP server and WebSocket server
  const server = http.createServer(web);
  const wss = new WebSocketServer({ server });
  const websocket = new WebsocketCallbacks(wss);

  const app = new App(appConfig, websocket);
  app.init().catch(console.error);

  web.get("/", (req, res) => {
    res.json(app.getConstellationIds());
  });

  web.get("/logs", (req, res) => {
    res.json(app.getLogs());
  });

  web.get("/address", (req, res) => {
    res.json(app.address);
  });

  web.post("/connect/:constellationId", async (req, res) => {
    const constellationId = parseInt(req.params.constellationId, 10);
    const newId = await app.connectNew(constellationId);

    websocket.sendConstellationsChanged();

    res.json({ newId: newId });
  });

  web.post("/create", async (req, res) => {
    const body = getBody(req, res);
    if (!body) return;

    const newId = await app.createNew(body.owners);

    websocket.sendConstellationsChanged();

    res.json({ newId: newId });
  });

  web.get("/:id", (req, res) => {
    const id = getId(req);
    res.json(app.getRoot(id));
  });

  web.get("/:id/data", (req, res) => {
    const { id, body } = getIdBody(req, res);
    if (!body) return;

    res.json(app.getData(id, body.path));
  });

  web.post("/:id/activate", async (req, res) => {
    const { id, body } = getIdBody(req, res);
    if (!body) return;

    await app.activate(id, body.path);
    res.sendStatus(200);
  });

  web.post("/:id/deactivate", async (req, res) => {
    const { id, body } = getIdBody(req, res);
    if (!body) return;

    await app.deactivate(id, body.path);
    res.sendStatus(200);
  });

  web.post("/:id/info", async (req, res) => {
    const { id, body } = getIdBody(req, res);
    if (!body) return;

    await app.getInfo(id, body.path);
    res.sendStatus(200);
  });

  web.post("/:id/properties", async (req, res) => {
    const { id, body } = getIdBody(req, res);
    if (!body) return;

    await app.updateProperties(id, body.path, body.properties);
    res.sendStatus(200);
  });

  web.post("/:id/data", (req, res) => {
    const { id, body } = getIdBody(req, res);
    if (!body) return;

    res.json(app.setData(id, body.path, body.data));
  });

  web.post("/:id/fetch", (req, res) => {
    const { id, body } = getIdBody(req, res);
    if (!body) return;

    res.json(app.fetch(id, body.path));
  });

  web.post("/:id/autofetch", (req, res) => {
    const { id, body } = getIdBody(req, res);
    if (!body) return;

    res.json(app.setAutoFetch(id, body.path, body.autofetch));
  });

  web.post("/:id/newfile", (req, res) => {
    const { id, body } = getIdBody(req, res);
    if (!body) return;

    res.json(app.createNewFile(id, body.path, body.type, body.owners));
  });

  web.post("/:id/newfolder", (req, res) => {
    const { id, body } = getIdBody(req, res);
    if (!body) return;

    res.json(app.createNewFolder(id, body.path, body.owners));
  });

  web.post("/:id/delete", (req, res) => {
    const { id, body } = getIdBody(req, res);
    if (!body) return;

    res.json(app.delete(id, body.path, body.updateStarStatus));
  });

  web.post("/close/:id", async (req, res) => {
    const id = getId(req);
    await app.disconnect(id);

    websocket.sendConstellationsChanged();

    res.sendStatus(200);
  });

  server.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
    console.log(`WebSocket server listening at ws://localhost:${port}`);
  });
}
