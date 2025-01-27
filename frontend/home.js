document.addEventListener("DOMContentLoaded", () => {
    const logoutBtn = document.getElementById("logout");
    const logEntryBtn = document.getElementById("log-entry");
    const entryText = document.getElementById("entry-text");
    const mapDiv = document.getElementById("map");
    const spinner = document.getElementById("spinner");

    const API_BASE_URL = "https://myt-27ol.onrender.com/api";

    let currentUser = localStorage.getItem('currentUser');
    let map = null;

    if (!currentUser) {
        // Redirect to login page if not logged in
        window.location.href = 'index.html';
    }

    logoutBtn.addEventListener("click", () => {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    });

    async function initializeMap() {
        if (map) return; // Prevent multiple map instances

        map = L.map(mapDiv).setView([32.7555, -97.3308], 10); // Default map view
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
        }).addTo(map);

        await loadUserEntries();
    }

    async function loadUserEntries() {
        try {
            const response = await fetch(`${API_BASE_URL}/entries?username=${currentUser}`, {
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

    function canLogEntry() {
        const lastEntryKey = `lastEntryTime_${currentUser}`; // Key specific to the current user
        const lastEntryTime = localStorage.getItem(lastEntryKey);

        if (!lastEntryTime) return true;
        
        const timeSinceLastEntry = Date.now() - parseInt(lastEntryTime);
        const tenMinutesInMs = 10 * 60 * 1000;
        
        return timeSinceLastEntry >= tenMinutesInMs;
    }

    const spinnerOverlay = document.getElementById("spinner-overlay");

    function showSpinner() {
        spinnerOverlay.style.display = "flex";
    }

    function hideSpinner() {
        spinnerOverlay.style.display = "none";
    }

    logEntryBtn.addEventListener("click", () => {
        const lastEntryKey = `lastEntryTime_${currentUser}`;

        if (!canLogEntry()) {
            const lastEntryTime = parseInt(localStorage.getItem(lastEntryKey), 10);
            const timeLeft = Math.ceil((600000 - (Date.now() - lastEntryTime)) / 60000);
            alert(`You can log another entry in ${timeLeft} minutes.`);
            return;
        }
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser.");
            return;
        }

        const entryTextValue = entryText.value.trim();
        if (entryTextValue.length > 100) {
        alert("Entry text cannot exceed 100 characters.");
        return;
        }

        showSpinner(); // Show spinner before getting location

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                const entry = {
                    text: entryText.value.trim(),
                    lat: latitude,
                    lng: longitude,
                    username: currentUser,
                };

                if (!entry.text) {
                    alert("Entry text cannot be empty.");
                    return;
                }

                // Calculate square_id based on latitude and longitude
                const squareSize = 0.01;
                const squareId = `${Math.floor(latitude / squareSize)}_${Math.floor(longitude / squareSize)}`;
                entry.squareId = squareId;

                try {
                    const response = await fetch(`${API_BASE_URL}/entries`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(entry),
                    });

                    if (!response.ok) {
                        const error = await response.json();
                        alert(error.message);
                        return;
                    }

                    L.marker([latitude, longitude])
                        .addTo(map)
                        .bindPopup(`<strong>${entry.username}</strong><br>${entry.text}`);
                    hideSpinner(); // Hide spinner after adding marker
                    alert("Congrats on your pee!");
                    entryText.value = "";
                    localStorage.setItem('lastEntryTime', Date.now().toString());
                } catch (err) {
                    console.error("Error logging entry:", err);
                    hideSpinner(); 
                    alert("Failed to log entry. Please try again.");
                }
            },
            () => {
                hideSpinner();
                alert("Unable to fetch your location. Make sure location services are enabled.");
            }
        );
    });
    
    // Initialize map when the page loads
    initializeMap();
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