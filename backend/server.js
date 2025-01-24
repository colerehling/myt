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

app.get("/api/entries", (req, res) => {
  const { username } = req.query;
  let sql = "SELECT * FROM map_entries";
  const values = [];
  if (username) {
    sql += " WHERE username = $1";
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

  try {
    await db.query('BEGIN'); // Start the transaction

    // First, delete any existing entries for the same square_id
    const squareSize = 0.005;
    const squareId = `${Math.floor(lat / squareSize)}_${Math.floor(lng / squareSize)}`;

    // Delete any old logs for the same square and user
    await db.query(
      "DELETE FROM square_ownership WHERE square_id = $1 AND username = $2",
      [squareId, username]
    );

    // Insert the new entry into square_ownership
    await db.query(
      `INSERT INTO square_ownership (username, square_id, latitude, longitude)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (square_id, username) DO UPDATE SET
         latitude = EXCLUDED.latitude,
         longitude = EXCLUDED.longitude,
         timestamp = CURRENT_TIMESTAMP`,
      [username, squareId, lat, lng]
    );

    // Now insert the new map entry as usual
    await db.query(
      "INSERT INTO map_entries (username, latitude, longitude, text) VALUES ($1, $2, $3, $4)",
      [username, lat, lng, text]
    );

    await db.query('COMMIT'); // Commit the transaction

    res.json({ success: true });
  } catch (err) {
    await db.query('ROLLBACK'); // Rollback in case of any error
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

app.get("/api/leaderboard", (req, res) => {
  const sql = `
    SELECT username, COUNT(*) as entry_count
    FROM map_entries
    GROUP BY username
    ORDER BY entry_count DESC
    LIMIT 5
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

