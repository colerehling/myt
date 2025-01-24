const express = require("express");
const bodyParser = require("body-parser");
const { Pool } = require("pg");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const turf = require('@turf/turf');
require("dotenv").config();

const app = express();

// Use the dynamic port assigned by Render or fallback to 3000
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// PostgreSQL Database Connection
const db = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT, 10),
});

db.connect((err) => {
    if (err) {
        console.error("Error connecting to the database:", err.message);
        process.exit(1);
    }
    console.log("Connected to PostgreSQL database.");
});

// Root Route - Add this to make sure you get a response at the root
app.get("/", (req, res) => {
    res.send("Welcome to the MYT API!");
});

// User Registration
app.post("/api/register", async (req, res) => {
    const { email, username, password } = req.body;

    // Validate fields
    if (!email || !username || !password) {
        return res.status(400).json({ success: false, message: "All fields are required." });
    }

    // Validate email format
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ success: false, message: "Please provide a valid email address." });
    }

    // Validate username and password length
    if (username.length < 4 || username.length > 30) {
        return res.status(400).json({ success: false, message: "Username must be between 4 and 30 characters long." });
    }

    if (password.length < 8 || password.length > 30) {
        return res.status(400).json({ success: false, message: "Password must be between 8 and 30 characters long." });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        // Check if email already exists
        db.query("SELECT * FROM users WHERE email = $1", [email], (err, results) => {
            if (err) {
                console.error("Database error:", err.message);
                return res.status(500).json({ success: false, message: "Internal server error." });
            }
            if (results.rows.length > 0) {
                return res.status(400).json({ success: false, message: "Email already exists." });
            }

            // Check if username already exists
            db.query("SELECT * FROM users WHERE username = $1", [username], (err, results) => {
                if (err) {
                    console.error("Database error:", err.message);
                    return res.status(500).json({ success: false, message: "Internal server error." });
                }
                if (results.rows.length > 0) {
                    return res.status(400).json({ success: false, message: "Username already exists." });
                }

                // Insert new user into database
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

// User Login
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

// Fetch All Entries or Entries by Username
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

// Fetch All Users
app.get("/api/users", (req, res) => {
    const sql = "SELECT * FROM users";

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Database error:", err.message);
            return res.status(500).json({ success: false, message: "Internal server error." });
        }

        res.json({ success: true, users: results.rows });
    });
});

// Add a New Map Entry
app.post("/api/entries", (req, res) => {
    const { username, text, lat, lng } = req.body;

    const sql = "INSERT INTO map_entries (username, latitude, longitude, text) VALUES ($1, $2, $3, $4)";
    const values = [username, lat, lng, text];

    db.query(sql, values, (err) => {
        if (err) {
            console.error("Database error:", err.message);
            return res.status(500).json({ success: false, message: "Internal server error." });
        }
        res.json({ success: true });
    });
});

// Leaderboard
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

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
