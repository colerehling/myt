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

    // Fetch user entries count, last entry date, and streak
    fetchUserEntriesData(currentUser);

    async function fetchUserEntriesData(username) {
        const userDetailsDiv = document.getElementById("userDetailsDiv");

        try {
            // Fetch user entries
            const entriesResponse = await fetch(`${API_BASE_URL}/entries?username=${username}`, {
                method: "GET",
                headers: { "Content-Type": "application/json" }
            });

            if (!entriesResponse.ok) {
                console.error("Error fetching user entries:", await entriesResponse.text());
                return;
            }

            const { entries } = await entriesResponse.json();

            // Display the number of entries
            const entriesCount = entries.length;
            document.getElementById("entriesCount").textContent = entriesCount;

            if (entriesCount > 0) {
                // Find the date of the last entry
                const lastEntry = entries.reduce((latest, entry) => {
                    const entryDate = new Date(entry.timestamp);
                    return entryDate > latest ? entryDate : latest;
                }, new Date(0));

                const lastEntryDateFormatted = lastEntry.toLocaleString();
                document.getElementById("lastEntryDate").textContent = lastEntryDateFormatted;

                // Calculate streak
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
        // Sort entries by date in descending order
        const sortedEntries = entries
            .map(entry => new Date(entry.timestamp))
            .sort((a, b) => b - a);

        let streak = 0;
        let currentDate = new Date(); // Start with today

        for (let entryDate of sortedEntries) {
            const entryDay = new Date(entryDate.toDateString()); // Remove time
            const currentDay = new Date(currentDate.toDateString()); // Remove time

            if (entryDay.getTime() === currentDay.getTime()) {
                // Entry matches the current streak day
                streak++;
                currentDate.setDate(currentDate.getDate() - 1); // Move to the previous day
            } else if (entryDay.getTime() < currentDay.getTime()) {
                // Gap in the streak
                break;
            }
        }

        return streak;
    }
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