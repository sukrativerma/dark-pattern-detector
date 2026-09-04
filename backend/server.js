const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
const PORT = 3001;

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Private-Network", "true");
  next();
});

app.use(cors());
app.use(express.json());
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Supabase requires SSL
});

app.get("/", (req, res) => {
  res.send("Dark Pattern Detector backend is running");
});

// Save a new scan
app.post("/scans", async (req, res) => {
  const { url, findings } = req.body;

  if (!url || !findings) {
    return res.status(400).json({ error: "url and findings are required" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO scans (url, findings) VALUES ($1, $2) RETURNING *",
      [url, JSON.stringify(findings)]
    );
    console.log("New scan saved:", result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Failed to save scan" });
  }
});

// Get all scans
app.get("/scans", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM scans ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Failed to fetch scans" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});