document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login-form");
    const registerForm = document.getElementById("register-form");
    const app = document.getElementById("app");
    const auth = document.getElementById("auth");
    const showRegister = document.getElementById("show-register");
    const showLogin = document.getElementById("show-login");
    const logoutBtn = document.getElementById("logout");
    const logEntryBtn = document.getElementById("log-entry");
    const entryText = document.getElementById("entry-text");
    const mapDiv = document.getElementById("map");

    const API_BASE_URL = "http://localhost:3000/api";

    let currentUser = null;
    let map = null; // Ensure single map instance

    showRegister.addEventListener("click", () => {
        loginForm.style.display = "none";
        registerForm.style.display = "block";
    });

    showLogin.addEventListener("click", () => {
        registerForm.style.display = "none";
        loginForm.style.display = "block";
    });

    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const username = document.getElementById("reg-username").value;
        const password = document.getElementById("reg-password").value;

        try {
            const response = await fetch(`${API_BASE_URL}/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            if (!response.ok) {
                const error = await response.json();
                alert(error.message);
                return;
            }

            alert("Registration successful!");
            showLogin.click();
        } catch (err) {
            console.error("Error during registration:", err);
            alert("Failed to register. Please try again.");
        }
    });

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;

        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            if (!response.ok) {
                const error = await response.json();
                alert(error.message);
                return;
            }

            currentUser = username;
            auth.style.display = "none";
            app.style.display = "block";
            initializeMap();
        } catch (err) {
            console.error("Error during login:", err);
            alert("Failed to login. Please try again.");
        }
    });

    logoutBtn.addEventListener("click", () => {
        currentUser = null;
        app.style.display = "none";
        auth.style.display = "block";
    });

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
                L.marker([entry.latitude, entry.longitude])
                    .addTo(map)
                    .bindPopup(`<strong>${entry.username}</strong><br>${entry.text}`);
            });
        } catch (err) {
            console.error("Error fetching entries:", err);
        }
    }

    logEntryBtn.addEventListener("click", () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser.");
            return;
        }

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
                    entryText.value = "";
                } catch (err) {
                    console.error("Error logging entry:", err);
                    alert("Failed to log entry. Please try again.");
                }
            },
            () => {
                alert("Unable to fetch your location.");
            }
        );
    });
});