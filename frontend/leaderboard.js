document.addEventListener('DOMContentLoaded', () => {
    // Fetch all leaderboards
    fetchLeaderboard();
    fetchSquareLeaderboard();
    fetchExtendedSquareLeaderboard();
    fetchVoronoiLeaderboard();
});

// Fetch main entries leaderboard
function fetchLeaderboard() {
    fetch('https://myt-27ol.onrender.com/api/leaderboard')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayLeaderboard(data.leaderboard, 'entries-leaderboard', 'Entries');
            } else {
                console.error('Failed to fetch leaderboard:', data.message);
            }
        })
        .catch(error => {
            console.error('Error fetching leaderboard:', error);
        });
}

// Fetch square leaderboard
function fetchSquareLeaderboard() {
    fetch('https://myt-27ol.onrender.com/api/square-leaderboard')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayLeaderboard(data.leaderboard, 'square-leaderboard', 'Territories');
            } else {
                console.error('Failed to fetch square leaderboard:', data.message);
            }
        })
        .catch(error => {
            console.error('Error fetching square leaderboard:', error);
        });
}

// Fetch extended square leaderboard
function fetchExtendedSquareLeaderboard() {
    fetch('https://myt-27ol.onrender.com/api/extended-square-leaderboard')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayLeaderboard(data.leaderboard, 'extended-square-leaderboard', 'Territories');
            } else {
                console.error('Failed to fetch extended square leaderboard:', data.message);
            }
        })
        .catch(error => {
            console.error('Error fetching extended square leaderboard:', error);
        });
}

// Display regular leaderboard
function displayLeaderboard(leaderboard, sectionId, metricName) {
    const leaderboardElement = document.getElementById(sectionId);
    leaderboardElement.innerHTML = ''; // Clear previous content

    const table = document.createElement('table');
    table.className = 'leaderboard-table';
    table.innerHTML = `
        <tr>
            <th>Rank</th>
            <th>Username</th>
            <th>${metricName}</th>
        </tr>
    `;

    leaderboard.forEach((user, index) => {
        const row = table.insertRow();
        row.innerHTML = `
            <td class="rank">${index + 1}</td>
            <td>${user.username}</td>
            <td>${user[metricName.toLowerCase()]?.toLocaleString() || 0}</td>
        `;
    });

    leaderboardElement.appendChild(table);
}

// Display expandable leaderboard
function displayExpandableLeaderboard(leaderboard, sectionId, metricName) {
    const container = document.getElementById(sectionId);
    container.innerHTML = ''; // Clear previous content
    
    // Create table structure
    const table = document.createElement('table');
    table.className = 'leaderboard-table';
    table.innerHTML = `
        <tr>
            <th>Rank</th>
            <th>Username</th>
            <th>${metricName}</th>
        </tr>
    `;

    // Add first 10 items
    leaderboard.slice(0, 10).forEach((user, index) => {
        addTableRow(table, user, index + 1);
    });

    // Add expandable section
    const expandSection = document.createElement('tbody');
    expandSection.style.display = 'none';
    expandSection.id = `${sectionId}-expanded`;
    
    leaderboard.slice(10).forEach((user, index) => {
        addTableRow(expandSection, user, index + 11);
    });

    // Create toggle button
    const toggleButton = document.createElement('button');
    toggleButton.className = 'expand-button';
    toggleButton.textContent = 'Show Full Leaderboard';
    toggleButton.onclick = () => toggleExpand(sectionId);

    // Assemble components
    container.appendChild(table);
    container.appendChild(expandSection);
    container.appendChild(toggleButton);
}

// Add table row helper
function addTableRow(parent, user, rank) {
    const row = parent.insertRow();
    row.innerHTML = `
        <td class="rank">${rank}</td>
        <td>${user.username}</td>
        <td>${user.territory_area?.toLocaleString() || 0}</td>
    `;
}

// Toggle expand/collapse
function toggleExpand(sectionId) {
    const expanded = document.getElementById(`${sectionId}-expanded`);
    const button = document.querySelector(`#${sectionId} .expand-button`);
    
    if (expanded.style.display === 'none') {
        expanded.style.display = 'table-row-group';
        button.textContent = 'Collapse Leaderboard';
    } else {
        expanded.style.display = 'none';
        button.textContent = 'Show Full Leaderboard';
    }
}

// Hamburger menu functionality
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