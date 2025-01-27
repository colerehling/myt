const express = require("express");
const bodyParser = require("body-parser");
const { Pool } = require("pg");
const cors = require("cors");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

const db = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT, 10),
  ssl: {
    rejectUnauthorized: false,
  },
});

db.connect((err) => {
  if (err) {
    console.error("Error connecting to the database:", err.message);
    process.exit(1);
  }
  console.log("Connected to PostgreSQL database.");
});

app.get("/", (req, res) => {
  res.send("Welcome to the MYT API!");
});

app.post("/api/register", async (req, res) => {
  const { email, username, password } = req.body;

  if (!email || !username || !password) {
    return res.status(400).json({ success: false, message: "All fields are required." });
  }

  const emailRegex = /\S+@\S+\.\S+/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, message: "Please provide a valid email address." });
  }

  if (username.length < 4 || username.length > 30) {
    return res.status(400).json({ success: false, message: "Username must be between 4 and 30 characters long." });
  }

  if (password.length < 8 || password.length > 30) {
    return res.status(400).json({ success: false, message: "Password must be between 8 and 30 characters long." });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    db.query("SELECT * FROM users WHERE email = $1", [email], (err, results) => {
      if (err) {
        console.error("Database error:", err.message);
        return res.status(500).json({ success: false, message: "Internal server error." });
      }
      if (results.rows.length > 0) {
        return res.status(400).json({ success: false, message: "Email already exists." });
      }
      db.query("SELECT * FROM users WHERE username = $1", [username], (err, results) => {
        if (err) {
          console.error("Database error:", err.message);
          return res.status(500).json({ success: false, message: "Internal server error." });
        }
        if (results.rows.length > 0) {
          return res.status(400).json({ success: false, message: "Username already exists." });
        }
        db.query("INSERT INTO users (email, username, password) VALUES ($1, $2, $3)", [email, username, hashedPassword], (err) => {
          if (err) {
            console.error("Database error:", err.message);
            return res.status(500).json({ success: false, message: "Internal server error." });
          }
          res.json({ success: true, message: "Registration successful!" });
        });
      });
    });
  } catch (err) {
    console.error("Error during registration:", err.message);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  db.query("SELECT * FROM users WHERE username = $1", [username], async (err, results) => {
    if (err) {
      console.error("Database error:", err.message);
      return res.status(500).json({ success: false, message: "Internal server error." });
    }
    if (results.rows.length === 0) {
      return res.status(401).json({ success: false, message: "Invalid username or password." });
    }
    const user = results.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: "Invalid username or password." });
    }
    res.json({ success: true });
  });
});

app.post("/api/users/color", async (req, res) => {
  const { username, color } = req.body;

  if (!username || !color) {
    return res.status(400).json({ success: false, message: "Username and color are required." });
  }

  try {
    await db.query("UPDATE users SET color = $1 WHERE username = $2", [color, username]);
    res.json({ message: "Color updated successfully" });
  } catch (error) {
    console.error("Error updating color:", error);
    res.status(500).json({ error: "Failed to update color" });
  }
});

app.get("/api/users/count", async (req, res) => {
  try {
    const result = await db.query("SELECT COUNT(*) FROM users");
    res.json({ userCount: result.rows[0].count });
  } catch (err) {
    console.error("Database error:", err.message);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

app.get("/api/entries", (req, res) => {
  const { username } = req.query;
  let sql = `
    SELECT DISTINCT ON (square_id) *
    FROM map_entries
    ORDER BY square_id, timestamp DESC
  `;
  const values = [];
  if (username) {
    sql = `
      SELECT DISTINCT ON (square_id) *
      FROM map_entries
      WHERE username = $1
      ORDER BY square_id, timestamp DESC
    `;
    values.push(username);
  }
  db.query(sql, values, (err, results) => {
    if (err) {
      console.error("Database error:", err.message);
      return res.status(500).json({ success: false, message: "Internal server error." });
    }
    res.json({ success: true, entries: results.rows });
  });
});

app.post("/api/entries", async (req, res) => {
  const { username, text, lat, lng } = req.body;

  const squareSize = 0.01;
  const squareId = `${Math.floor(lat / squareSize)}_${Math.floor(lng / squareSize)}`;

  try {
    await db.query(
      `INSERT INTO square_ownership (username, square_id, latitude, longitude, timestamp)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
       ON CONFLICT (square_id, username) DO UPDATE SET
         latitude = EXCLUDED.latitude,
         longitude = EXCLUDED.longitude,
         timestamp = CURRENT_TIMESTAMP`,
      [username, squareId, lat, lng]
    );

    await db.query(
      "INSERT INTO map_entries (username, square_id, latitude, longitude, text) VALUES ($1, $2, $3, $4, $5)",
      [username, squareId, lat, lng, text]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Database error:", err.message);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

app.get("/api/entries/count", async (req, res) => {
  try {
    const result = await db.query("SELECT COUNT(*) FROM map_entries");
    res.json({ totalMarks: result.rows[0].count });
  } catch (err) {
    console.error("Database error:", err.message);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

app.get("/api/squares", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM square_ownership");
    res.json({ success: true, squares: result.rows });
  } catch (err) {
    console.error("Database error:", err.message);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// First leaderboard for counting map entries per user
app.get("/api/leaderboard", (req, res) => {
    const sql = `
      SELECT username, COUNT(*) as entry_count
      FROM map_entries
      GROUP BY username
      ORDER BY entry_count DESC
      LIMIT 10
    `;
    db.query(sql, (err, results) => {
      if (err) {
        console.error("Database error:", err.message);
        return res.status(500).json({ success: false, message: "Internal server error." });
      }
      res.json({ success: true, leaderboard: results.rows });
    });
  });
  
  app.get("/api/square-leaderboard", (req, res) => {
    const sql = `
      SELECT username, COUNT(DISTINCT square_id) as territory_count
      FROM map_entries
      GROUP BY username
      ORDER BY territory_count DESC
      LIMIT 10
    `;
    
    db.query(sql, (err, results) => {
      if (err) {
        console.error("Database error:", err.message);
        return res.status(500).json({ success: false, message: "Internal server error." });
      }
      
      res.json({ success: true, leaderboard: results.rows });
    });
  });
  

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
