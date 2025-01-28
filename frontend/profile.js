document.addEventListener("DOMContentLoaded", () => {
    const userDetailsDiv = document.getElementById("user-details");
    const currentUser = localStorage.getItem('currentUser');
    const API_BASE_URL = "https://myt-27ol.onrender.com/api";

    if (!currentUser) {
        // Redirect to login page if not logged in
        window.location.href = 'index.html';
        return; // Stop further execution
    }

    // Display the username
    userDetailsDiv.textContent = `${currentUser}`;

    // Fetch user stats
    fetch(`${API_BASE_URL}/entries?username=${currentUser}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const entries = data.entries;
                const entriesCount = entries.length;
                const lastEntryDate = entries.length > 0 ? new Date(entries[0].timestamp) : null;
                const streak = calculateStreak(entries);
                const totalEntries = entries.length > 0 ? entries[0].total_entries : 0;

                document.getElementById("entriesCount").textContent = entriesCount;
                document.getElementById("lastEntryDate").textContent = lastEntryDate ? lastEntryDate.toLocaleString() : "No entries";
                document.getElementById("streak").textContent = streak;
                document.getElementById("totalEntries").textContent = totalEntries;
            } else {
                console.error('Failed to fetch user entries:', data.message);
            }
        })
        .catch(error => {
            console.error('Error fetching user entries:', error);
        });
});

// Function to calculate the streak of consecutive days with entries
function calculateStreak(entries) {
    if (entries.length === 0) return 0;

    let streak = 1;
    let lastDate = new Date(entries[0].timestamp).setHours(0, 0, 0, 0);

    for (let i = 1; i < entries.length; i++) {
        const currentDate = new Date(entries[i].timestamp).setHours(0, 0, 0, 0);
        const diffDays = (lastDate - currentDate) / (1000 * 60 * 60 * 24);

        if (diffDays === 1) {
            streak++;
        } else if (diffDays > 1) {
            break;
        }

        lastDate = currentDate;
    }

    return streak;
}

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

