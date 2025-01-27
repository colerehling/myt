document.addEventListener('DOMContentLoaded', () => {
    fetchLeaderboard();
    fetchSquareLeaderboard();
});

function fetchLeaderboard() {
    fetch('https://myt-27ol.onrender.com/api/leaderboard')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayLeaderboard(data.leaderboard, 'entries-leaderboard');
            } else {
                console.error('Failed to fetch leaderboard:', data.message);
            }
        })
        .catch(error => {
            console.error('Error fetching leaderboard:', error);
        });
}

function fetchSquareLeaderboard() {
    fetch('https://myt-27ol.onrender.com/api/square-leaderboard')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayLeaderboard(data.leaderboard, 'square-leaderboard');
            } else {
                console.error('Failed to fetch square leaderboard:', data.message);
            }
        })
        .catch(error => {
            console.error('Error fetching square leaderboard:', error);
        });
}

function displayLeaderboard(leaderboard, sectionId) {
    const leaderboardElement = document.getElementById(sectionId);

    const table = document.createElement('table');
    table.className = 'leaderboard-table';
    table.innerHTML = `
        <tr>
            <th>Rank</th>
            <th>Username</th>
            <th>${sectionId === 'entries-leaderboard' ? 'Entries' : 'Territory Count'}</th>
        </tr>
    `;

    leaderboard.forEach((user, index) => {
        const row = table.insertRow();
        row.innerHTML = `
            <td class="rank">${index + 1}</td>
            <td>${user.username}</td>
            <td>${sectionId === 'entries-leaderboard' ? user.entry_count : user.territory_count}</td>
        `;
    });

    leaderboardElement.appendChild(table);
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
