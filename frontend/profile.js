const API_BASE_URL = "https://myt-27ol.onrender.com/api";

async function checkUsernameChangeCooldown() {
    const messageEl = document.getElementById("usernameChangeMessage");
    const changeButton = document.getElementById("changeUsernameBtn");

    try {
        const response = await fetch(`${API_BASE_URL}/username-change-info?username=${localStorage.getItem("currentUser")}`);
        const data = await response.json();

        if (data.success) {
            const lastChangeDate = new Date(data.lastChangeDate);
            const now = new Date();
            const daysSinceLastChange = Math.floor((now - lastChangeDate) / (1000 * 60 * 60 * 24));

            if (daysSinceLastChange < 30) {
                const daysLeft = 30 - daysSinceLastChange;
                messageEl.textContent = `You can change your username again in ${daysLeft} day(s).`;
                changeButton.disabled = true;
            }
        }
    } catch (error) {
        console.error("Error checking username change cooldown:", error);
    }
}

// Handle username change request
document.getElementById("changeUsernameBtn").addEventListener("click", async () => {
    const newUsername = document.getElementById("newUsername").value.trim();
    const currentUsername = localStorage.getItem("currentUser");
    const messageEl = document.getElementById("usernameChangeMessage");

    if (!newUsername) {
        messageEl.textContent = "Please enter a new username.";
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/change-username`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ currentUsername, newUsername }),
        });

        const data = await response.json();
        if (data.success) {
            messageEl.textContent = "Username changed successfully! You can change it again in 30 days.";
            localStorage.setItem("currentUser", newUsername); // Update the localStorage
            document.getElementById("user-details").textContent = newUsername;
            document.getElementById("changeUsernameBtn").disabled = true;
        } else {
            messageEl.textContent = data.message;
        }
    } catch (error) {
        messageEl.textContent = "Error updating username.";
        console.error("Error:", error);
    }
});

document.addEventListener("DOMContentLoaded", () => {
    const userDetailsDiv = document.getElementById("user-details");
    const currentUser = localStorage.getItem('currentUser');

    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }

    userDetailsDiv.textContent = `${currentUser}`;

    fetch(`${API_BASE_URL}/entries?username=${currentUser}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const entries = data.entries;
                const entriesCount = entries.length;
                const lastEntry = entries.reduce((latest, current) => 
                    new Date(current.timestamp) > new Date(latest.timestamp) ? current : latest, entries[0]
                );

                const lastEntryDate = lastEntry ? new Date(lastEntry.timestamp) : null;
                const totalEntries = entries.length > 0 ? entries[0].total_entries : 0;

                document.getElementById("entriesCount").textContent = entriesCount;
                document.getElementById("lastEntryDate").textContent = lastEntryDate ? lastEntryDate.toLocaleString() : "No entries";
                document.getElementById("totalEntries").textContent = totalEntries;
            } else {
                console.error('Failed to fetch user entries:', data.message);
            }
        })
        .catch(error => console.error('Error fetching user entries:', error));

    checkUsernameChangeCooldown();
});

// Hamburger menu handling
document.addEventListener("DOMContentLoaded", () => {
    const hamburgerButton = document.getElementById("hamburger-button");
    const menuLinks = document.getElementById("menu-links");

    hamburgerButton.addEventListener("click", () => {
        menuLinks.style.display = menuLinks.style.display === "block" ? "none" : "block";
    });

    document.addEventListener("click", (event) => {
        if (!menuLinks.contains(event.target) && !hamburgerButton.contains(event.target)) {
            menuLinks.style.display = "none";
        }
    });
});

