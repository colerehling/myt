document.addEventListener('DOMContentLoaded', () => {
    fetchLeaderboard();
    fetchSquareLeaderboard();
    fetchExtendedSquareLeaderboard();
    fetchVoronoiLeaderboard(); // Add this line
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

function fetchExtendedSquareLeaderboard() {
    fetch('https://myt-27ol.onrender.com/api/extended-square-leaderboard')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayLeaderboard(data.leaderboard, 'extended-square-leaderboard');
            } else {
                console.error('Failed to fetch extended square leaderboard:', data.message);
            }
        })
        .catch(error => {
            console.error('Error fetching extended square leaderboard:', error);
        });
}

function fetchVoronoiLeaderboard() {
    fetch('https://myt-27ol.onrender.com/api/voronoi-leaderboard')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayLeaderboard(data.leaderboard, 'voronoi-leaderboard');
            } else {
                console.error('Failed to fetch Voronoi leaderboard:', data.message);
            }
        })
        .catch(error => {
            console.error('Error fetching Voronoi leaderboard:', error);
        });
}

function displayLeaderboard(leaderboard, sectionId) {
    const leaderboardElement = document.getElementById(sectionId);
    leaderboardElement.innerHTML = ''; // Clear previous content

    const table = document.createElement('table');
    table.className = 'leaderboard-table';
    
    // Determine column header
    let columnHeader;
    if (sectionId === 'entries-leaderboard') {
        columnHeader = 'Entries';
    } else if (sectionId === 'voronoi-leaderboard') {
        columnHeader = 'Area (sq mi)';
    } else {
        columnHeader = 'Territory Count';
    }

    table.innerHTML = `
        <tr>
            <th>Rank</th>
            <th>Username</th>
            <th>${columnHeader}</th>
        </tr>
    `;

    leaderboard.forEach((user, index) => {
        const row = table.insertRow();
        let value;
        
        if (sectionId === 'entries-leaderboard') {
            value = user.entry_count;
        } else if (sectionId === 'voronoi-leaderboard') {
            value = user.area.toLocaleString();
        } else {
            value = user.territory_count;
        }

        row.innerHTML = `
            <td class="rank">${index + 1}</td>
            <td>${user.username}</td>
            <td>${value}</td>
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