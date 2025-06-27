import express from "express";

export function main() {
  const app = express();
  const port = process.env.PORT || 3000;

  app.use(express.json());

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
    res.json({ number: num, body });
  });

  app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
  });
}
