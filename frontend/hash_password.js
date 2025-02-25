const bcrypt = require("bcryptjs");

const newPassword = "royalflush";
const saltRounds = 10;

async function hashPassword() {
    try {
        const hash = await bcrypt.hash(newPassword, saltRounds);
        console.log("Hashed password:", hash);
    } catch (err) {
        console.error("Error hashing password:", err);
    }
}

hashPassword();