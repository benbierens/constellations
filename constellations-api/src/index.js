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
    const newId = await app.connectNew(req.params.constellationId);

    websocket.sendConstellationsChanged();

    res.json({ newId: newId });
  });

  web.post("/create", async (req, res) => {
    const body = req.body;
    if (!body || typeof body !== "object") {
      return res
        .status(400)
        .json({ error: "Request body must be a JSON object" });
    }

    const newId = await app.createNew(body.owners);

    websocket.sendConstellationsChanged();

    res.json({ newId: newId });
  });

  web.post("/create", async (req, res) => {
    const body = req.body;
    if (!body || typeof body !== "object") {
      return res
        .status(400)
        .json({ error: "Request body must be a JSON object" });
    }

    const newId = await app.createNew(body.owners);

    websocket.sendConstellationsChanged();

    res.json({ newId: newId });
  });

  web.post("/close/:id", async (req, res) => {
    const id = parseInt(req.params.id, 10);
    await app.disconnect(id);

    websocket.sendConstellationsChanged();

    res.sendStatus(200);
  });

  web.get("/api/:number", (req, res) => {
    const num = parseInt(req.params.number, 10);
    if (isNaN(num)) {
      return res.status(400).json({ error: "Parameter must be an integer" });
    }
    res.json({ number: num, message: `You sent the integer ${num}` });
  });

  web.post("/api/:number", (req, res) => {
    const num = parseInt(req.params.number, 10);
    if (isNaN(num)) {
      return res.status(400).json({ error: "Parameter must be an integer" });
    }
    const body = req.body;
    if (!body || typeof body !== "object") {
      return res
        .status(400)
        .json({ error: "Request body must be a JSON object" });
    }
    res.json({ number: num, body });
  });

  server.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
    console.log(`WebSocket server listening at ws://localhost:${port}`);
  });
}
