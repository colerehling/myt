const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcrypt");
require("dotenv").config();

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MySQL Database Connection
const db = mysql.createConnection({
    host: process.env.DB_HOST ,
    user: process.env.DB_USER ,
    password: process.env.DB_PASSWORD ,
    database: process.env.DB_NAME ,
    port: process.env.DB_PORT
});

db.connect((err) => {
    if (err) {
        console.error("Error connecting to the database:", err.message);
        process.exit(1);
    }
    console.log("Connected to MySQL database.");
});

// Routes

// User Registration
app.post("/api/register", async (req, res) => {
    const { email, username, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        db.query("SELECT * FROM users WHERE email = ?", [email], (err, results) => {
            if (err) {
                console.error("Database error:", err.message);
                return res.status(500).json({ success: false, message: "Internal server error." });
            }
            if (results.length > 0) {
                return res.status(400).json({ success: false, message: "Email already exists." });
            }

        db.query("SELECT * FROM users WHERE username = ?", [username], (err, results) => {
            if (err) {
                console.error("Database error:", err.message);
                return res.status(500).json({ success: false, message: "Internal server error." });
            }
            if (results.length > 0) {
                return res.status(400).json({ success: false, message: "Username already exists." });
            }

            db.query("INSERT INTO users (username, password) VALUES (?, ?)", [username, hashedPassword], (err) => {
                if (err) {
                    console.error("Database error:", err.message);
                    return res.status(500).json({ success: false, message: "Internal server error." });
                }
                res.json({ success: true });
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

    db.query("SELECT * FROM users WHERE username = ?", [username], async (err, results) => {
        if (err) {
            console.error("Database error:", err.message);
            return res.status(500).json({ success: false, message: "Internal server error." });
        }
        if (results.length === 0) {
            return res.status(401).json({ success: false, message: "Invalid username or password." });
        }

        const user = results[0];
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
        sql += " WHERE username = ?";
        values.push(username);
    }

    db.query(sql, values, (err, results) => {
        if (err) {
            console.error("Database error:", err.message);
            return res.status(500).json({ success: false, message: "Internal server error." });
        }

        res.json({ success: true, entries: results });
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

        res.json({ success: true, users: results });
    });
});

// Add a New Map Entry
app.post("/api/entries", (req, res) => {
    const { username, text, lat, lng } = req.body;

    const sql = "INSERT INTO map_entries (username, latitude, longitude, text) VALUES (?, ?, ?, ?)";
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

        res.json({ success: true, leaderboard: results });
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});