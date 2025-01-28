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
                // Find the most recent entry
                const lastEntry = entries.reduce((latest, current) => {
                    return new Date(current.timestamp) > new Date(latest.timestamp) ? current : latest;
                }, entries[0]);

                const lastEntryDate = lastEntry ? new Date(lastEntry.timestamp) : null;
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

    // Sort entries by timestamp in descending order (most recent first)
    entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    let streak = 1;
    let currentDate = new Date(entries[0].timestamp);
    currentDate.setHours(0, 0, 0, 0);

    for (let i = 1; i < entries.length; i++) {
        const entryDate = new Date(entries[i].timestamp);
        entryDate.setHours(0, 0, 0, 0);

        const diffDays = (currentDate - entryDate) / (1000 * 60 * 60 * 24);
        if (diffDays === 1) {
            streak++;
            currentDate = entryDate;
        } else if (diffDays === 0) {
            // Same day, continue to next entry
            continue;
        } else {
            // Streak is broken
            break;
        }
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

