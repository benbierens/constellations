import express from "express";
import http from "http";
import { WebSocketServer } from "ws";

export function main() {
  const app = express();
  const port = process.env.PORT || 3000;

  app.use(express.json());

  // Create HTTP server and WebSocket server
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });

  // Store connected clients
  const clients = new Set();

  wss.on("connection", (ws) => {
    clients.add(ws);
    ws.on("close", () => {
      clients.delete(ws);
    });
  });

  app.get("/", (req, res) => {
    res.json({ message: "Welcome to the Constellations API!" });
  });

  app.get("/api/:number", (req, res) => {
    const num = parseInt(req.params.number, 10);
    if (isNaN(num)) {
      return res.status(400).json({ error: "Parameter must be an integer" });
    }
    res.json({ number: num, message: `You sent the integer ${num}` });
  });

  app.post("/api/:number", (req, res) => {
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
    // Broadcast to all connected WebSocket clients
    const message = JSON.stringify(body);
    for (const ws of clients) {
      if (ws.readyState === ws.OPEN) {
        ws.send(message);
      }
    }
    res.json({ number: num, body });
  });

  server.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
    console.log(`WebSocket server listening at ws://localhost:${port}`);
  });
}
