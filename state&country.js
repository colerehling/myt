const mysql = require("mysql2/promise");
const fetch = require("node-fetch");

// Database connection
const db = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "your_password",
    database: "your_database",
});

async function updateStateAndCountry() {
    try {
        // Fetch all rows with latitude and longitude
        const [rows] = await db.query("SELECT id, latitude, longitude FROM map_entries WHERE state IS NULL OR country IS NULL");

        for (const row of rows) {
            const { id, latitude, longitude } = row;

            // Use OpenStreetMap Nominatim API for reverse geocoding
            const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`;

            const response = await fetch(url);
            if (!response.ok) {
                console.error(`Failed to fetch geocoding data for ID ${id}`);
                continue;
            }

            const data = await response.json();
            const state = data.address.state || null;
            const country = data.address.country || null;

            if (state && country) {
                // Update the state and country in the database
                await db.query("UPDATE map_entries SET state = ?, country = ? WHERE id = ?", [state, country, id]);
                console.log(`Updated ID ${id} with State: ${state}, Country: ${country}`);
            } else {
                console.warn(`Missing state or country data for ID ${id}`);
            }
        }
    } catch (err) {
        console.error("Error updating state and country:", err);
    } finally {
        db.end();
    }
}

// Run the script
updateStateAndCountry();
