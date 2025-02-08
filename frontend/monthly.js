// Fetch leaderboard on page load
document.addEventListener("DOMContentLoaded", fetchInviteLeaderboard);

async function fetchInviteLeaderboard() {
    try {
        const response = await fetch("https://myt-27ol.onrender.com/api/invite-leaderboard");
        const data = await response.json();

        if (data.success) {
            const tbody = document.querySelector("#invite-leaderboard tbody");
            tbody.innerHTML = ""; // Clear old data

            data.leaderboard.forEach((entry, index) => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${entry.inviter}</td>
                    <td>${entry.invite_count}</td>
                `;
                tbody.appendChild(row);
            });
        } else {
            console.error("Error loading leaderboard:", data.message);
        }
    } catch (error) {
        console.error("Error fetching leaderboard:", error);
    }
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