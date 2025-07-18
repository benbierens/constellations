import express from "express";
import cors from "cors";
import http from "http";
import bodyParser from "body-parser";
import { WebSocketServer } from "ws";
import { App } from "./app.js";
import { appConfig } from "./config.js";
import { WebsocketCallbacks } from "./websocketCallbacks.js";

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

function safe(res, action) {
  try {
    action();
  } catch (error) {
    res.status(500);
    res.send("Server error: " + error);
  }
}

async function safeAsync(res, action) {
  try {
    await action();
  } catch (error) {
    res.status(500);
    res.send("Server error: " + error);
  }
}

export async function main() {
  const web = express();
  const port = process.env.PORT || 3000;

  web.use(cors());
  web.use(bodyParser.json({ limit: "10mb" }))

  // Create HTTP server and WebSocket server
  const server = http.createServer(web);
  const wss = new WebSocketServer({ server });
  const websocket = new WebsocketCallbacks(wss);

  console.log("Initializing with configuration: " + JSON.stringify(appConfig));

  const app = new App(appConfig, websocket);
  await app.init();

  web.get("/", (req, res) => {
    safe(res, () => {
      res.json(app.getConstellationIds());
    });
  });

  web.get("/logs", (req, res) => {
    res.json(app.getLogs());
  });

  web.get("/address", (req, res) => {
    res.json(app.address);
  });

  web.post("/connect/:constellationId", async (req, res) => {
    await safeAsync(res, async () => {
      const constellationId = parseInt(req.params.constellationId, 10);
      const newId = await app.connectNew(constellationId);

      websocket.sendConstellationsChanged();

      res.json({ newId: newId });
    });
  });

  web.post("/create", async (req, res) => {
    await safeAsync(res, async () => {
      const body = getBody(req, res);
      if (!body) return;

      const newId = await app.createNew(body.owners);

      websocket.sendConstellationsChanged();

      res.json({ newId: newId });
    });
  });

  web.get("/:id", (req, res) => {
    safe(req, () => {
      const id = getId(req);
      res.json(app.getRoot(id));
    });
  });

  web.post("/:id/activate", async (req, res) => {
    await safeAsync(res, async () => {
      const { id, body } = getIdBody(req, res);
      if (!body) return;

      await app.activate(id, body.path);
      res.sendStatus(200);
    });
  });

  web.post("/:id/deactivate", async (req, res) => {
    await safeAsync(res, async () => {
      const { id, body } = getIdBody(req, res);
      if (!body) return;

      await app.deactivate(id, body.path);
      res.sendStatus(200);
    });
  });

  web.post("/:id/info", (req, res) => {
    safe(req, () => {
      const { id, body } = getIdBody(req, res);
      if (!body) return;

      res.json(app.getInfo(id, body.path));
    });
  });

  web.post("/:id/properties", async (req, res) => {
    await safeAsync(res, async () => {
      const { id, body } = getIdBody(req, res);
      if (!body) return;

      await app.updateProperties(id, body.path, body.properties);
      res.sendStatus(200);
    });
  });

  web.post("/:id/getdata", async (req, res) => {
    await safeAsync(res, async () => {
      const { id, body } = getIdBody(req, res);
      if (!body) return;

      res.send(await app.getData(id, body.path));
    });
  });

  web.post("/:id/setdata", async (req, res) => {
    await safeAsync(res, async () => {
      const { id, body } = getIdBody(req, res);
      if (!body) return;

      await app.setData(id, body.path, body.data);
      res.sendStatus(200);
    });
  });

  web.post("/:id/fetch", async (req, res) => {
    await safeAsync(res, async () => {
      const { id, body } = getIdBody(req, res);
      if (!body) return;

      await app.fetch(id, body.path);
      res.sendStatus(200);
    });
  });

  web.post("/:id/autofetch", async (req, res) => {
    await safeAsync(res, async () => {
      const { id, body } = getIdBody(req, res);
      if (!body) return;

      await app.setAutoFetch(id, body.path, body.autofetch);
      res.sendStatus(200);
    });
  });

  web.post("/:id/newfile", async (req, res) => {
    await safeAsync(res, async () => {
      const { id, body } = getIdBody(req, res);
      if (!body) return;

      res.json(await app.createNewFile(id, body.path, body.type, body.owners));
    });
  });

  web.post("/:id/newfolder", async (req, res) => {
    await safeAsync(res, async () => {
      const { id, body } = getIdBody(req, res);
      if (!body) return;

      res.json(await app.createNewFolder(id, body.path, body.owners));
    });
  });

  web.post("/:id/delete", async (req, res) => {
    await safeAsync(res, async () => {
      const { id, body } = getIdBody(req, res);
      if (!body) return;

      await app.delete(id, body.path, body.updateStarStatus);
      res.sendStatus(200);
    });
  });

  web.post("/close/:id", async (req, res) => {
    await safeAsync(res, async () => {
      const id = getId(req);
      await app.disconnect(id);

      websocket.sendConstellationsChanged();
      res.sendStatus(200);
    });
  });

  server.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
    console.log(`WebSocket server listening at ws://localhost:${port}`);
  });
}

main().catch(console.error); 
