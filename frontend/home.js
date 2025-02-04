document.addEventListener("DOMContentLoaded", () => {
    const logoutBtn = document.getElementById("logout");
    const logEntryBtn = document.getElementById("log-entry");
    const entryText = document.getElementById("entry-text");
    const mapDiv = document.getElementById("map");
    const spinner = document.getElementById("spinner");
    const createEntryBtn = document.getElementById("create-entry");
    const entryForm = document.getElementById("entry-form");

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

    createEntryBtn.addEventListener("click", () => {
        entryForm.style.display = "block";
        createEntryBtn.style.display = "none";
    });

    async function initializeMap() {
        if (map) return; // Prevent multiple map instances
    
        // Default coordinates
        let defaultLat = 32.7555;
        let defaultLng = -97.3308;
        let defaultZoom = 10;
    
        try {
            const response = await fetch(`${API_BASE_URL}/entries?username=${currentUser}`);
            if (response.ok) {
                const { entries } = await response.json();
                if (entries.length > 0) {
                    const lastEntry = entries.reduce((latest, current) => 
                        new Date(current.timestamp) > new Date(latest.timestamp) ? current : latest
                    );
                    defaultLat = lastEntry.latitude;
                    defaultLng = lastEntry.longitude;
                    defaultZoom = 12;
                }
            } else {
                console.warn("Failed to fetch user entries for map initialization.");
            }
        } catch (err) {
            console.error("Error fetching user entries:", err);
        }
    
        map = L.map(mapDiv).setView([defaultLat, defaultLng], defaultZoom);
    
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
            maxZoom: 19,
            minZoom: 3,
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
                const dateTime = new Date(entry.timestamp);
                const formattedDate = dateTime.toLocaleString();

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
        const lastEntryKey = `lastEntryTime_${currentUser}`;
        const lastEntryTime = parseInt(localStorage.getItem(lastEntryKey), 10);

        if (!lastEntryTime || isNaN(lastEntryTime)) return true;

        const timeSinceLastEntry = Date.now() - lastEntryTime;
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
        const lastEntryTime = parseInt(localStorage.getItem(lastEntryKey), 10);

        if (!canLogEntry()) {
            if (!isNaN(lastEntryTime)) {
                const timeLeft = Math.ceil((600000 - (Date.now() - lastEntryTime)) / 60000);
                alert(`You can log another entry in ${timeLeft} minutes.`);
            } else {
                alert("Cooldown time not found. Try again later.");
            }
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

        showSpinner();

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
                    hideSpinner();
                    alert("🎉Congrats on your pee!🎉");
                    entryText.value = "";

                    localStorage.setItem(lastEntryKey, Date.now().toString());
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

    initializeMap();
});

// JavaScript to toggle the hamburger menu
document.addEventListener("DOMContentLoaded", () => {
    const hamburgerButton = document.getElementById("hamburger-button");
    const menuLinks = document.getElementById("menu-links");

    hamburgerButton.addEventListener("click", () => {
        if (menuLinks.style.display === "block") {
            menuLinks.style.display = "none";
        } else {
            menuLinks.style.display = "block";
        }
    });

    document.addEventListener("click", (event) => {
        if (!menuLinks.contains(event.target) && !hamburgerButton.contains(event.target)) {
            menuLinks.style.display = "none";
        }
    });
});
