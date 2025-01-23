document.addEventListener("DOMContentLoaded", () => {
    const logoutBtn = document.getElementById("logout");
    const logEntryBtn = document.getElementById("log-entry");
    const entryText = document.getElementById("entry-text");
    const mapDiv = document.getElementById("map");

    const API_BASE_URL = "https://myt-27ol.onrender.com/api";

    let currentUser = localStorage.getItem('currentUser');
    let map = null;

    if (!currentUser) {
        // Redirect to login page if not logged in
        window.location.href = 'index.html';
    }

    // Initialize the map
    async function initializeMap() {
        if (map) return; // Prevent multiple map instances

        map = L.map(mapDiv).setView([32.7555, -97.3308], 10); // Default map view
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
        }).addTo(map);

        await loadAllEntries();
    }

    async function loadAllEntries() {
        try {
            const response = await fetch(`${API_BASE_URL}/entries`, {
                method: "GET",
                headers: { "Content-Type": "application/json" }
            });
            if (!response.ok) {
                console.error("Error loading entries:", await response.text());
                return;
            }

            const { entries } = await response.json();
            entries.forEach((entry) => {
                const dateTime = new Date(entry.timestamp); // Convert the timestamp to a Date object
                const formattedDate = dateTime.toLocaleString(); // Format the date and time for display
                
                L.marker([entry.latitude, entry.longitude])
                    .addTo(map)
                    .bindPopup(
                        `<strong>${entry.username}</strong><br>
                        <em>${formattedDate}</em><br>
                        ${entry.text}<br>`
                    );
            });
        } catch (err) {
            console.error("Error fetching entries:", err);
        }
    }

    async function fetchAllUsersEntriesCount() {
        const userDetailsDiv = document.getElementById("userDetailsDiv");
    
        try {
            const response = await fetch(`${API_BASE_URL}/entries`, {
                method: "GET",
                headers: { "Content-Type": "application/json" }
            });
    
            if (!response.ok) {
                console.error("Error fetching entries:", await response.text());
                return;
            }
    
            const { entries } = await response.json();
            const entriesCount = entries.length;
    
            document.getElementById("entriesCount").textContent = entriesCount;
        } catch (error) {
            console.error("Error fetching entries count for all users:", error);
        }
    }    

async function fetchAllUsersEntriesCount() {
        const userDetailsDiv = document.getElementById("userDetailsDiv");
    
        try {
            const response = await fetch(`${API_BASE_URL}/entries`, {
                method: "GET",
                headers: { "Content-Type": "application/json" }
            });
    
            if (!response.ok) {
                console.error("Error fetching entries:", await response.text());
                return;
            }
    
            const { entries } = await response.json();
            const entriesCount = entries.length;
    
            document.getElementById("entriesCount").textContent = entriesCount;
        } catch (error) {
            console.error("Error fetching entries count for all users:", error);
        }
    } 

    async function fetchNumberOfUsers() {
        try {
            const response = await fetch(`${API_BASE_URL}/users`, {
                method: "GET",
                headers: { "Content-Type": "application/json" }
            });
    
            if (!response.ok) {
                console.error("Error fetching users:", await response.text());
                return;
            }
    
            const { users } = await response.json();
            const usersCount = users.length;
    
            document.getElementById("usersCount").textContent = usersCount;
        } catch (error) {
            console.error("Error fetching the number of users:", error);
        }
    }
    // Initialize map and fetch statistics on page load
    initializeMap();
    fetchAllUsersEntriesCount();
    fetchNumberOfUsers();
});

// JavaScript to toggle the hamburger menu
document.addEventListener("DOMContentLoaded", () => {
    const hamburgerButton = document.getElementById("hamburger-button");
    const menuLinks = document.getElementById("menu-links");

    hamburgerButton.addEventListener("click", () => {
        // Toggle menu visibility
        if (menuLinks.style.display === "block") {
            menuLinks.style.display = "none";
        } else {
            menuLinks.style.display = "block";
        }
    });

    // Close menu when clicking outside
    document.addEventListener("click", (event) => {
        if (!menuLinks.contains(event.target) && !hamburgerButton.contains(event.target)) {
            menuLinks.style.display = "none";
        }
    });
});
