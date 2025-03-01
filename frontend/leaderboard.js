document.addEventListener('DOMContentLoaded', () => {
    fetchLeaderboard();
    fetchSquareLeaderboard();
    fetchExtendedSquareLeaderboard();
    fetchVoronoiLeaderboard(); // Add this line
});

// Add event listener for the "Monthly Challenge" button
const toggleLeaderboardButton = document.getElementById('toggle-leaderboard-button');
    if (toggleLeaderboardButton) {
        let isMonthlyView = false; // Track the current view

        toggleLeaderboardButton.addEventListener('click', () => {
            if (isMonthlyView) {
                // Switch to "Show All Leaderboards" mode
                document.querySelectorAll('.leaderboard-container').forEach(container => {
                    container.style.display = 'block'; // Show all leaderboards
                });
                document.getElementById('monthly-leaderboard').style.display = 'none'; // Hide monthly leaderboard
                toggleLeaderboardButton.textContent = 'Monthly Leaderboard'; // Update button text
            } else {
                // Switch to "Monthly Leaderboard" mode
                document.querySelectorAll('.leaderboard-container').forEach(container => {
                    container.style.display = 'none'; // Hide all leaderboards
                });
                document.getElementById('monthly-leaderboard').style.display = 'block'; // Show monthly leaderboard
                fetchMonthlyLeaderboard(); // Fetch monthly leaderboard data
                toggleLeaderboardButton.textContent = 'All Leaderboards'; // Update button text
            }

            isMonthlyView = !isMonthlyView; // Toggle the state
        });
    }


// Add event listener for the "Show All" button
const showAllButton = document.getElementById('show-all-button');
if (showAllButton) {
    showAllButton.addEventListener('click', fetchAllVoronoiLeaderboard);
};

function fetchMonthlyLeaderboard() {
    fetch('https://myt-27ol.onrender.com/api/monthly-leaderboard')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayLeaderboard(data.leaderboard, 'monthly-leaderboard-content');
            } else {
                console.error('Failed to fetch monthly leaderboard:', data.message);
            }
        })
        .catch(error => {
            console.error('Error fetching monthly leaderboard:', error);
        });
}

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

// Function to fetch all Voronoi leaderboard entries
function fetchAllVoronoiLeaderboard() {
    fetch('https://myt-27ol.onrender.com/api/voronoi-leaderboard?limit=all') // Add a query parameter to fetch all entries
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayLeaderboard(data.leaderboard, 'voronoi-leaderboard');
            } else {
                console.error('Failed to fetch all Voronoi leaderboard entries:', data.message);
            }
        })
        .catch(error => {
            console.error('Error fetching all Voronoi leaderboard entries:', error);
        });
}

function displayLeaderboard(leaderboard, sectionId) {
    const leaderboardElement = document.getElementById(sectionId);
    leaderboardElement.innerHTML = ''; // Clear previous content

    const table = document.createElement('table');
    table.className = 'leaderboard-table';

    // Determine column header and value key based on the section
    let columnHeader, valueKey;
    if (sectionId === 'entries-leaderboard') {
        columnHeader = 'Entries';
        valueKey = 'entry_count';
    } else if (sectionId === 'voronoi-leaderboard') {
        columnHeader = 'Area (sq mi)';
        valueKey = 'area';
    } else if (sectionId === 'monthly-leaderboard-content') {
        columnHeader = 'Marks';
        valueKey = 'entry_count'; // Assuming the API returns 'entry_count' for monthly leaderboard
    } else {
        columnHeader = 'Territory Count';
        valueKey = 'territory_count';
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
        let value = user[valueKey]; // Use the dynamic key to access the value

        if (value === undefined) {
            console.error(`Undefined value for key '${valueKey}' in user:`, user);
            value = 0; // Default to 0 if the value is undefined
        }

        // Format the value based on the section
        if (sectionId === 'voronoi-leaderboard') {
            value = parseFloat(value).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        } else {
            value = value.toLocaleString(); // Format numbers with commas
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