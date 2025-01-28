const http = require("http");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const PORT = process.env.PORT || 3000;

const db = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT, 10),
  ssl: { rejectUnauthorized: false },
});

db.connect((err) => {
  if (err) {
    console.error("Error connecting to the database:", err.message);
    process.exit(1);
  }
  console.log("Connected to PostgreSQL database.");
});

const parseBody = async (req) => {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error("Invalid JSON"));
      }
    });
  });
};

const routes = {
  async register(req, res) {
    try {
      const { email, username, password } = await parseBody(req);
      if (!email || !username || !password) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ success: false, message: "All fields are required." }));
      }

      const emailRegex = /\S+@\S+\.\S+/;
      if (!emailRegex.test(email)) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ success: false, message: "Invalid email address." }));
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const emailExists = await db.query("SELECT 1 FROM users WHERE email = $1", [email]);
      if (emailExists.rows.length) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ success: false, message: "Email already exists." }));
      }

      const usernameExists = await db.query("SELECT 1 FROM users WHERE username = $1", [username]);
      if (usernameExists.rows.length) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ success: false, message: "Username already exists." }));
      }

      await db.query("INSERT INTO users (email, username, password) VALUES ($1, $2, $3)", [email, username, hashedPassword]);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: true, message: "Registration successful!" }));
    } catch (err) {
      console.error("Error during registration:", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: false, message: "Internal server error." }));
    }
  },

  async login(req, res) {
    try {
      const { username, password } = await parseBody(req);
      const userQuery = await db.query("SELECT * FROM users WHERE username = $1", [username]);

      if (!userQuery.rows.length) {
        res.writeHead(401, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ success: false, message: "Invalid username or password." }));
      }

      const user = userQuery.rows[0];
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        res.writeHead(401, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ success: false, message: "Invalid username or password." }));
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: true, user: { id: user.id, username: user.username } }));
    } catch (err) {
      console.error("Error during login:", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: false, message: "Internal server error." }));
    }
  },

  async notFound(req, res) {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ success: false, message: "Route not found." }));
  },
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const { pathname } = url;

  if (req.method === "POST" && pathname === "/api/register") {
    return routes.register(req, res);
  } else if (req.method === "POST" && pathname === "/api/login") {
    return routes.login(req, res);
  } else {
    return routes.notFound(req, res);
  }
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});