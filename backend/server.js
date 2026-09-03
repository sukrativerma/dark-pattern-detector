const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Temporary in-memory storage — resets every time the server restarts
// We'll swap this for a real database soon
let scans = [];
let nextId = 1;

app.get("/", (req, res) => {
  res.send("Dark Pattern Detector backend is running");
});

// Save a new scan
app.post("/scans", (req, res) => {
  const { url, findings } = req.body;

  if (!url || !findings) {
    return res.status(400).json({ error: "url and findings are required" });
  }

  const scan = {
    id: nextId++,
    url,
    findings,
    timestamp: new Date().toISOString()
  };

  scans.push(scan);
  console.log("New scan saved:", scan);
  res.status(201).json(scan);
});

// Get all scans
app.get("/scans", (req, res) => {
  res.json(scans);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});