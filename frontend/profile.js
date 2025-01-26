document.addEventListener("DOMContentLoaded", () => {
    const userDetailsDiv = document.getElementById("user-details");
    const currentUser = localStorage.getItem('currentUser');
    const API_BASE_URL = "https://myt-27ol.onrender.com/api";

    const colorPicker = document.getElementById("colorPicker");
    const setColorBtn = document.getElementById("setColorBtn");
    const confirmColorBtn = document.getElementById("confirmColorBtn");
    const colorPreview = document.getElementById("colorPreview");

    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }

    userDetailsDiv.textContent = `${currentUser}`;

    fetchUserEntriesData(currentUser);
    loadUserColor();

    async function fetchUserEntriesData(username) {
        const userDetailsDiv = document.getElementById("userDetailsDiv");

        try {
            const entriesResponse = await fetch(`${API_BASE_URL}/entries?username=${username}`, {
                method: "GET",
                headers: { "Content-Type": "application/json" }
            });

            if (!entriesResponse.ok) {
                console.error("Error fetching user entries:", await entriesResponse.text());
                return;
            }

            const { entries } = await entriesResponse.json();

            const entriesCount = entries.length;
            document.getElementById("entriesCount").textContent = entriesCount;

            if (entriesCount > 0) {
                const lastEntry = entries.reduce((latest, entry) => {
                    const entryDate = new Date(entry.timestamp);
                    return entryDate > latest ? entryDate : latest;
                }, new Date(0));

                const lastEntryDateFormatted = lastEntry.toLocaleString();
                document.getElementById("lastEntryDate").textContent = lastEntryDateFormatted;

                const streak = calculateStreak(entries);
                document.getElementById("streak").textContent = `${streak} day(s)`;
            } else {
                document.getElementById("lastEntryDate").textContent = "No entries yet";
                document.getElementById("streak").textContent = "0 day(s)";
            }
        } catch (error) {
            console.error("Error fetching user entries data:", error);
        }
    }

    function calculateStreak(entries) {
        const sortedEntries = entries
            .map(entry => new Date(entry.timestamp))
            .sort((a, b) => b - a);

        let streak = 0;
        let currentDate = new Date();

        for (let entryDate of sortedEntries) {
            const entryDay = new Date(entryDate.toDateString());
            const currentDay = new Date(currentDate.toDateString());

            if (entryDay.getTime() === currentDay.getTime()) {
                streak++;
                currentDate.setDate(currentDate.getDate() - 1);
            } else if (entryDay.getTime() < currentDay.getTime()) {
                break;
            }
        }

        return streak;
    }

    // Color selection functionality
    async function loadUserColor() {
        try {
            const response = await fetch(`${API_BASE_URL}/users/color`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error("Failed to load user color");
            }

            const { color } = await response.json();
            if (color) {
                colorPicker.value = color;
                colorPreview.style.backgroundColor = color;
            }
        } catch (error) {
            console.error("Error loading user color:", error);
        }
    }

    async function setUserColor(color) {
        try {
            const response = await fetch(`${API_BASE_URL}/users/color`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ color: color })
            });

            if (!response.ok) {
                throw new Error("Failed to set color");
            }

            const data = await response.json();
            if (data.waitPeriod) {
                alert(`You need to wait ${data.waitPeriod} days before changing your color again.`);
                return false;
            }

            alert("Color set successfully!");
            return true;
        } catch (error) {
            console.error("Error setting color:", error);
            alert("Failed to set color. Please try again.");
            return false;
        }
    }

    colorPicker.addEventListener("input", () => {
        colorPreview.style.backgroundColor = colorPicker.value;
    });

    setColorBtn.addEventListener("click", () => {
        const selectedColor = colorPicker.value;
        colorPreview.style.backgroundColor = selectedColor;
        confirmColorBtn.style.display = "inline-block";
    });

    confirmColorBtn.addEventListener("click", async () => {
        const selectedColor = colorPicker.value;
        const success = await setUserColor(selectedColor);
        if (success) {
            confirmColorBtn.style.display = "none";
        }
    });

    // Hamburger menu functionality
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
