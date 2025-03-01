const express = require("express");
const bodyParser = require("body-parser");
const { Pool } = require("pg");
const cors = require("cors");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
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

// Register API
app.post("/api/register", async (req, res) => {
  const { email, username, password, inviter } = req.body;

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

    // Check if email already exists
    const emailCheck = await db.query("SELECT * FROM users WHERE email = $1", [email]);
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ success: false, message: "Email already exists." });
    }

    // Check if username already exists (case-insensitive check)
    const usernameCheck = await db.query("SELECT * FROM users WHERE LOWER(username) = LOWER($1)", [username]);
    if (usernameCheck.rows.length > 0) {
      return res.status(400).json({ success: false, message: "Username already exists." });
    }

    // Insert new user into the users table (preserving case)
    await db.query(
      "INSERT INTO users (email, username, password) VALUES ($1, $2, $3)",
      [email, username, hashedPassword]
    );

    // Handle inviter logic if provided
    if (inviter) {
      const inviterCheck = await db.query("SELECT username FROM users WHERE LOWER(username) = LOWER($1)", [inviter]);

      if (inviterCheck.rows.length > 0) {
        await db.query(
          "INSERT INTO invites (inviter, invitee, has_entry) VALUES ($1, $2, 'N') ON CONFLICT (invitee) DO NOTHING",
          [inviterCheck.rows[0].username, username]
        );
      }
    }

    res.json({ success: true, message: "Registration successful!" });
  } catch (err) {
    console.error("Error during registration:", err.message);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// Login API (case-insensitive username matching)
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: "All fields are required." });
  }

  try {
    // Find the user case-insensitively but return the original case
    const userCheck = await db.query("SELECT * FROM users WHERE LOWER(username) = LOWER($1)", [username]);

    if (userCheck.rows.length === 0) {
      return res.status(401).json({ success: false, message: "Invalid username or password." });
    }

    const user = userCheck.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: "Invalid username or password." });
    }

    res.json({ success: true, username: user.username });
  } catch (err) {
    console.error("Error during login:", err.message);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// Helper function to get location from coordinates
async function getLocationFromCoords(latitude, longitude) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;
  try {
    const response = await fetch(url);
    const data = await response.json();

    const state = data.address?.state || "";
    const country = data.address?.country || "Unknown";

    return { state, country };
  } catch (error) {
    console.error("Error fetching state and country:", error);
    return { state: "Unknown", country: "Unknown" };
  }
}

app.get("/api/users/count", async (req, res) => {
  try {
    const result = await db.query("SELECT COUNT(*) FROM users");
    res.json({ userCount: result.rows[0].count });
  } catch (err) {
    console.error("Database error:", err.message);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// Entries API with case-insensitive username handling
app.post("/api/entries", async (req, res) => {
  let { username, text, lat, lng } = req.body;

  // Validate input
  if (!username || !text || !lat || !lng) {
    return res.status(400).json({ success: false, message: "All fields are required." });
  }

  // Resolve username to correct case
  try {
    const userCheck = await db.query("SELECT username FROM users WHERE LOWER(username) = LOWER($1)", [username]);
    if (userCheck.rows.length === 0) {
      return res.status(400).json({ success: false, message: "User not found." });
    }
    username = userCheck.rows[0].username;
  } catch (err) {
    console.error("Error resolving username:", err.message);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }

  try {
    const { state, country } = await getLocationFromCoords(lat, lng);
    const squareSize = 0.01;
    const squareId = `${Math.floor(lat / squareSize)}_${Math.floor(lng / squareSize)}`;

    // Insert or update square ownership
    await db.query(
      `INSERT INTO square_ownership (username, square_id, latitude, longitude, timestamp)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
       ON CONFLICT (square_id, username) DO UPDATE SET
         latitude = EXCLUDED.latitude,
         longitude = EXCLUDED.longitude,
         timestamp = CURRENT_TIMESTAMP`,
      [username, squareId, lat, lng]
    );

    // Insert new map entry
    await db.query(
      "INSERT INTO map_entries (username, square_id, latitude, longitude, text, state, country) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [username, squareId, lat, lng, text, state, country]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Database error:", err.message);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// Get entries with case-insensitive username handling
app.get("/api/entries", async (req, res) => {
  const { username: inputUsername } = req.query;
  let sql = `
    SELECT DISTINCT ON (square_id) *
    FROM map_entries
    ORDER BY square_id, timestamp DESC
  `;
  const values = [];
  let username = inputUsername;

  if (inputUsername) {
    try {
      const userCheck = await db.query("SELECT username FROM users WHERE LOWER(username) = LOWER($1)", [inputUsername]);
      if (userCheck.rows.length === 0) {
        return res.status(400).json({ success: false, message: "User not found." });
      }
      username = userCheck.rows[0].username;
    } catch (err) {
      console.error("Error resolving username:", err.message);
      return res.status(500).json({ success: false, message: "Internal server error." });
    }

    sql = `
      SELECT DISTINCT ON (square_id) *, (SELECT COUNT(*) FROM map_entries WHERE username = $1) as total_entries
      FROM map_entries
      WHERE username = $1
      ORDER BY square_id, timestamp DESC
    `;
    values.push(username);
  }
  try {
    const results = await db.query(sql, values);
    res.json({ success: true, entries: results.rows });
  } catch (err) {
    console.error("Database error:", err.message);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

app.post("/api/entries", async (req, res) => {
  const { username, text, lat, lng } = req.body;

  try {
    const userCheck = await db.query("SELECT username FROM users WHERE LOWER(username) = LOWER($1)", [username]);
    if (userCheck.rows.length === 0) {
      return res.status(400).json({ success: false, message: "User not found." });
    }
    username = userCheck.rows[0].username;
  } catch (err) {
    console.error("Error resolving username:", err.message);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }

  const { state, country } = await getLocationFromCoords(lat, lng);
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
      "INSERT INTO map_entries (username, square_id, latitude, longitude, text, state, country) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [username, squareId, lat, lng, text, state, country]
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

// New endpoint to get the count of unique states
app.get("/api/entries/states/count", async (req, res) => {
  try {
    const query = `
      SELECT COUNT(DISTINCT state) AS state_count 
      FROM map_entries 
      WHERE state IS NOT NULL AND state != ''
    `;
    const result = await db.query(query);
    const stateCount = result.rows[0].state_count;
    res.json({ stateCount });
  } catch (error) {
    console.error('Error fetching state count:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.get("/api/entries/countries/count", async (req, res) => {
  try {
    const query = `
      SELECT COUNT(DISTINCT country) AS country_count 
      FROM map_entries 
      WHERE country IS NOT NULL AND country != ''
    `;
    const result = await db.query(query);
    const countryCount = result.rows[0].country_count;
    res.json({ countryCount });
  } catch (error) {
    console.error('Error fetching country count:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
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

  app.get("/api/extended-square-leaderboard", async (req, res) => {
    try {
        const result = await db.query(`
            SELECT username, COUNT(DISTINCT square_id) AS territory_count
            FROM square_ownership
            GROUP BY username
            ORDER BY territory_count DESC
            LIMIT 10
        `);

        res.json({ success: true, leaderboard: result.rows });
    } catch (err) {
        console.error("Database error:", err.message);
        res.status(500).json({ success: false, message: "Internal server error." });
    }
});

app.get("/api/voronoi-leaderboard", (req, res) => {
  const sql = `
      SELECT username, area
      FROM user_areas
      ORDER BY area DESC
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

app.get("/api/recent-entries", async (req, res) => {
  try {
      const result = await db.query(`
          SELECT username, timestamp, state, country, text 
          FROM map_entries 
          ORDER BY timestamp DESC 
          LIMIT 10
      `);

      // Modify the result to check if the state is blank and if so, display the country
      const entries = result.rows.map(entry => {
          // If state is blank, use the country instead
          if (!entry.state || entry.state.trim() === '') {
              entry.state = entry.country; // Replace state with country if state is blank
          }
          return entry;
      });

      res.json({ success: true, entries: entries });
  } catch (err) {
      console.error("Database error:", err.message);
      res.status(500).json({ success: false, message: "Internal server error." });
  }
});


app.get("/api/invite-leaderboard", (req, res) => {
  const sql = `
    SELECT inviter, COUNT(*) AS invite_count
    FROM invites
    WHERE has_entry = 'Y'
    GROUP BY inviter
    ORDER BY invite_count DESC
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

app.get("/api/username-change-info", async (req, res) => {
  const { username } = req.query;

  if (!username) {
      return res.status(400).json({ success: false, message: "Username is required." });
  }

  try {
      // Query the database for the last username change
      const userQuery = await db.query("SELECT last_username_change FROM users WHERE username = $1", [username]);

      if (userQuery.rows.length === 0) {
          return res.status(404).json({ success: false, message: "User not found." });
      }

      const lastChangeDate = userQuery.rows[0].last_username_change;
      res.json({ success: true, lastChangeDate });
  } catch (err) {
      console.error("Error fetching username change info:", err.message);
      res.status(500).json({ success: false, message: "Internal server error." });
  }
});

app.post("/api/change-username", async (req, res) => {
  const { currentUsername: inputCurrentUsername, newUsername } = req.body;

  if (!inputCurrentUsername || !newUsername) {
    return res.status(400).json({ success: false, message: "Both current and new usernames are required." });
  }

  try {
    // Resolve current username case
    const userCheck = await db.query(
      "SELECT id, username, last_username_change FROM users WHERE LOWER(username) = LOWER($1)",
      [inputCurrentUsername]
    );
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    const currentUser = userCheck.rows[0];
    const currentUsername = currentUser.username;
    const userId = currentUser.id;
    const lastChangeDate = currentUser.last_username_change;

    // Check new username availability
    const newUserCheck = await db.query(
      "SELECT * FROM users WHERE LOWER(username) = LOWER($1)",
      [newUsername]
    );
    if (newUserCheck.rows.length > 0) {
      return res.status(400).json({ success: false, message: "Username already taken." });
    }

    // Check cooldown period
    const now = new Date();
    const daysSinceLastChange = lastChangeDate ? 
      Math.floor((now - new Date(lastChangeDate)) / (1000 * 60 * 60 * 24)) : 31;
    if (daysSinceLastChange < 30) {
      return res.status(403).json({ success: false, message: `You can change your username again in ${30 - daysSinceLastChange} day(s).` });
    }

    // Transaction
    await db.query("BEGIN");

    await db.query(
      "UPDATE users SET username = $1, last_username_change = $2 WHERE id = $3",
      [newUsername, now, userId]
    );

    await db.query(
      "INSERT INTO username_history (user_id, old_username, new_username) VALUES ($1, $2, $3)",
      [userId, currentUsername, newUsername]
    );

    // Update all username references
    await db.query("UPDATE map_entries SET username = $1 WHERE username = $2", [newUsername, currentUsername]);
    await db.query("UPDATE square_ownership SET username = $1 WHERE username = $2", [newUsername, currentUsername]);
    await db.query("UPDATE invites SET inviter = $1 WHERE inviter = $2", [newUsername, currentUsername]);
    await db.query("UPDATE invites SET invitee = $1 WHERE invitee = $2", [newUsername, currentUsername]);

    await db.query("COMMIT");

    res.json({ success: true, message: "Username updated successfully." });
  } catch (err) {
    await db.query("ROLLBACK");
    console.error("Error during username change:", err.message);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});




app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
