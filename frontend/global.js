document.addEventListener("DOMContentLoaded", () => {
    const entryText = document.getElementById("entry-text");
    const mapDiv = document.getElementById("map");
    const API_BASE_URL = "https://myt-27ol.onrender.com/api";
    let currentUser = localStorage.getItem('currentUser');
    let map = null;

    if (!currentUser) {
        window.location.href = 'index.html';
    }

    const colorMap = {};
    const userColors = {};

    async function initializeMap() {
        if (map) return;
        map = L.map(mapDiv).setView([32.7555, -97.3308], 10);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
        }).addTo(map);

        const gridLayer = L.layerGroup().addTo(map);

        async function updateGrid() {
            gridLayer.clearLayers();

            const bounds = map.getBounds();
            const squareSize = 0.005;

            const south = Math.floor(bounds.getSouth() / squareSize) * squareSize;
            const north = Math.ceil(bounds.getNorth() / squareSize) * squareSize;
            const west = Math.floor(bounds.getWest() / squareSize) * squareSize;
            const east = Math.ceil(bounds.getEast() / squareSize) * squareSize;

            for (let lat = south; lat < north; lat += squareSize) {
                for (let lng = west; lng < east; lng += squareSize) {
                    const squareId = getSquareId(lat, lng, squareSize);
                    const rectangle = L.rectangle([[lat, lng], [lat + squareSize, lng + squareSize]], {
                        color: '#000',
                        weight: 1,
                        opacity: 0.05,
                        fillOpacity: 0,
                    }).addTo(gridLayer);

                    if (colorMap[squareId]) {
                        rectangle.setStyle({
                            fillColor: colorMap[squareId],
                            fillOpacity: .8,
                        });
                    }
                }
            }
        }

        await updateGrid();
        map.on('moveend', updateGrid);

        await loadAllEntries();
        await loadSquareOwnership();
    }

    async function loadAllEntries() {
        try {
            const response = await fetch(`${API_BASE_URL}/entries`, {
                method: "GET",
                headers: { "Content-Type": "application/json" }
            });
            if (!response.ok) {
                console.error("Error loading entries:", await response.text());
                return;
            }
            const { entries } = await response.json();
            entries.forEach((entry) => {
                const dateTime = new Date(entry.timestamp);
                const formattedDate = dateTime.toLocaleString();
                L.marker([entry.latitude, entry.longitude])
                    .addTo(map)
                    .bindPopup(
                        `<strong>${entry.username}</strong><br>
                        <em>${formattedDate}</em><br>
                        ${entry.text}<br>`
                    );
            });
        } catch (err) {
            console.error("Error fetching entries:", err);
        }
    }

    async function loadSquareOwnership() {
        try {
            const response = await fetch(`${API_BASE_URL}/squares`);
            if (!response.ok) {
                console.error("Error loading square ownership:", await response.text());
                return;
            }

            const { squares } = await response.json();
            console.log("Squares data:", squares);
            populateColorMap(squares);
            await updateGrid();
        } catch (err) {
            console.error("Error fetching square ownership:", err);
        }
    }

    function populateColorMap(squares) {
        squares.forEach(square => {
            if (!userColors[square.username]) {
                userColors[square.username] = square.color || getColorForUsername(square.username);
            }
            colorMap[square.square_id] = userColors[square.username];
        });

        console.log("Color map populated:", colorMap);
    }

    function getSquareId(lat, lng, squareSize) {
        const normalizedLat = Math.floor(lat / squareSize);
        const normalizedLng = Math.floor(lng / squareSize);
        return `${normalizedLat}_${normalizedLng}`;
    }

    function getColorForUsername(username) {
        const hash = [...username].reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const hue = hash % 360; // Hue (0-360)
        const saturation = 70; // Saturation (70%)
        const lightness = 50; // Lightness (50%)
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }

    async function fetchAllUsersEntriesCount() {
        const userDetailsDiv = document.getElementById("userDetailsDiv");
        try {
            const response = await fetch(`${API_BASE_URL}/entries`, {
                method: "GET",
                headers: { "Content-Type": "application/json" }
            });
            if (!response.ok) {
                console.error("Error fetching entries:", await response.text());
                return;
            }
            const { entries } = await response.json();
            const entriesCount = entries.length;
            document.getElementById("entriesCount").textContent = entriesCount;
        } catch (error) {
            console.error("Error fetching entries count for all users:", error);
        }
    }

    async function fetchNumberOfUsers() {
        try {
            const response = await fetch(`${API_BASE_URL}/users/count`, {
                method: "GET",
                headers: { "Content-Type": "application/json" }
            });
            if (!response.ok) {
                console.error("Error fetching users:", await response.text());
                return;
            }
            const { userCount } = await response.json();
            document.getElementById("usersCount").textContent = userCount;
        } catch (error) {
            console.error("Error fetching the number of users:", error);
        }
    }

    async function fetchTotalMarks() {
        try {
            const response = await fetch(`${API_BASE_URL}/entries/count`, {
                method: "GET",
                headers: { "Content-Type": "application/json" }
            });
            if (!response.ok) {
                console.error("Error fetching total marks:", await response.text());
                return;
            }
            const { totalMarks } = await response.json();
            document.getElementById("totalMarks").textContent = totalMarks;
        } catch (error) {
            console.error("Error fetching total marks:", error);
        }
    }

    initializeMap();
    fetchAllUsersEntriesCount();
    fetchNumberOfUsers();
    fetchTotalMarks();

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
