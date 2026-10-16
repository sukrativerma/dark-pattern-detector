const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const { Pool } = require("pg");
const { clerkMiddleware, getAuth } = require("@clerk/express");
require("dotenv").config();

const app = express();
const PORT = 3001;

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Private-Network", "true");
  next();
});

app.use(cors());
app.use(express.json());
app.use(clerkMiddleware()); // reads the logged-in user's session from the request

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Supabase requires SSL
});

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

app.get("/", (req, res) => {
  res.send("Dark Pattern Detector backend is running");
});

// DASHBOARD: generate (or regenerate) the logged-in user's personal API token.
// The plain token is returned once; only its hash is stored.
app.post("/token", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Not signed in" });

  const token = "dpd_" + crypto.randomBytes(24).toString("hex");

  try {
    await pool.query(
      `INSERT INTO api_tokens (user_id, token_hash) VALUES ($1, $2)
       ON CONFLICT (user_id)
       DO UPDATE SET token_hash = EXCLUDED.token_hash, created_at = NOW()`,
      [userId, hashToken(token)]
    );
    res.json({ token });
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Failed to create token" });
  }
});

// EXTENSION: save a scan, identified by the personal token (not a login session)
app.post("/scans", async (req, res) => {
  const token = req.get("X-API-Token");
  if (!token) return res.status(401).json({ error: "Missing API token" });

  const { url, findings } = req.body;
  if (!url || !findings) {
    return res.status(400).json({ error: "url and findings are required" });
  }

  try {
    const tokenRow = await pool.query(
      "SELECT user_id FROM api_tokens WHERE token_hash = $1",
      [hashToken(token)]
    );
    if (tokenRow.rows.length === 0) {
      return res.status(401).json({ error: "Invalid API token" });
    }

    const result = await pool.query(
      "INSERT INTO scans (url, findings, user_id) VALUES ($1, $2, $3) RETURNING *",
      [url, JSON.stringify(findings), tokenRow.rows[0].user_id]
    );
    console.log("New scan saved for user:", tokenRow.rows[0].user_id);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Failed to save scan" });
  }
});

// DASHBOARD: get only the logged-in user's own scans
app.get("/scans", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Not signed in" });

  try {
    const result = await pool.query(
      "SELECT * FROM scans WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Failed to fetch scans" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});