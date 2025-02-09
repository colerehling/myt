document.addEventListener("DOMContentLoaded", () => {
    const mapDiv = document.getElementById("map");
    const API_BASE_URL = "https://myt-27ol.onrender.com/api";
    let currentUser = localStorage.getItem('currentUser');
    let map = null;

    if (!currentUser) {
        window.location.href = 'index.html';
    }

    const colorMap = {};
    const userColors = {};
    const baseSquareSize = 0.01; // Base size for squares

    // Custom Grid Layer
    const GridLayer = L.GridLayer.extend({
        createTile: function (coords) {
            const tile = L.DomUtil.create('canvas', 'leaflet-tile');
            const size = this.getTileSize();
            tile.width = size.x;
            tile.height = size.y;
            this.drawTile(tile, coords);
            return tile;
        },

        drawTile: function (canvas, coords) {
            const ctx = canvas.getContext('2d');
            const tileSize = this.getTileSize();
            const nwPoint = coords.scaleBy(tileSize);
            const se = nwPoint.add(tileSize);
            const nw = this._map.unproject(nwPoint, coords.z);
            const sePoint = this._map.unproject(se, coords.z);

            // Dynamically adjust square size based on zoom level
            const zoomLevel = this._map.getZoom();
            const dynamicSquareSize = baseSquareSize * Math.pow(2, Math.max(0, 10 - zoomLevel)); // Adjust based on zoom level

            for (let lat = nw.lat; lat > sePoint.lat; lat -= dynamicSquareSize) {
                for (let lng = nw.lng; lng < sePoint.lng; lng += dynamicSquareSize) {
                    const squareId = `${Math.floor(lat / dynamicSquareSize)}_${Math.floor(lng / dynamicSquareSize)}`;
                    const pixelBounds = this.getPixelBounds(lat, lng, dynamicSquareSize, coords, tileSize);

                    ctx.beginPath();
                    ctx.rect(pixelBounds.x, pixelBounds.y, pixelBounds.width, pixelBounds.height);
                    ctx.strokeStyle = '#000';
                    ctx.lineWidth = 0.5;
                    ctx.globalAlpha = 0.05;
                    ctx.stroke();
                    ctx.globalAlpha = 1;

                    // Determine the color
                    const color = colorMap[squareId] || this.findNearestColor(lat, lng);

                    if (color) {  // Only fill if a valid color is found
                        ctx.fillStyle = color;
                        ctx.fill();
                    }
                }
            }
        },

        getPixelBounds: function (lat, lng, squareSize, coords, tileSize) {
            const nw = this._map.project([lat, lng], coords.z);
            const se = this._map.project([lat - squareSize, lng + squareSize], coords.z);
            const tileNW = coords.scaleBy(tileSize);

            return {
                x: nw.x - tileNW.x,
                y: nw.y - tileNW.y,
                width: se.x - nw.x,
                height: se.y - nw.y
            };
        },

        findNearestColor: function (lat, lng) {
            let nearestColor = null;
            let minDistance = Infinity;

            for (const [squareId, color] of Object.entries(colorMap)) {
                const [squareLat, squareLng] = squareId.split('_').map(coord => parseFloat(coord) * baseSquareSize);
                const distance = Math.pow(lat - squareLat, 2) + Math.pow(lng - squareLng, 2);

                if (distance < minDistance) {
                    minDistance = distance;
                    nearestColor = color;
                }
            }

            return nearestColor;
        }
    });

    async function initializeMap() {
        if (map) return;

        // Default coordinates and zoom level
        let defaultLat = 32.7555;
        let defaultLng = -97.3308;
        let defaultZoom = 10;

        try {
            // Fetch user entries to determine the most recent entry
            const response = await fetch(`${API_BASE_URL}/entries?username=${currentUser}`);
            if (response.ok) {
                const { entries } = await response.json();
                if (entries.length > 0) {
                    // Get the most recent entry based on timestamp
                    const lastEntry = entries.reduce((latest, current) =>
                        new Date(current.timestamp) > new Date(latest.timestamp) ? current : latest
                    );
                    defaultLat = lastEntry.latitude;
                    defaultLng = lastEntry.longitude;
                    defaultZoom = 12; // Zoom in closer to the last entry
                }
            } else {
                console.warn("Failed to fetch user entries for map initialization.");
            }
        } catch (err) {
            console.error("Error fetching user entries:", err);
        }

        // Initialize the map with the determined default view
        map = L.map(mapDiv, {
            minZoom: 1, // Set the minimum zoom level
            maxZoom: 17 // Set the maximum zoom level
        }).setView([defaultLat, defaultLng], defaultZoom);

        // Add a tile layer to the map
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
            maxZoom: 17,
        }).addTo(map);

        // Add the custom grid layer
        new GridLayer().addTo(map);

        // Load other data for the map
        await loadData();
    }

    async function loadData() {
        try {
            // Fetch all data in parallel
            const [entriesResponse, squaresResponse, usersCountResponse, totalMarksResponse, statesCountResponse] = await Promise.all([
                fetch(`${API_BASE_URL}/entries`),
                fetch(`${API_BASE_URL}/squares`),
                fetch(`${API_BASE_URL}/users/count`),
                fetch(`${API_BASE_URL}/entries/count`),
                fetch(`${API_BASE_URL}/entries/states/count`)
            ]);

            // Handle potential errors
            if (!entriesResponse.ok || !squaresResponse.ok || !usersCountResponse.ok || !totalMarksResponse.ok || !statesCountResponse.ok) {
                console.error("Error loading data:", await entriesResponse.text(), await squaresResponse.text(), await statesCountResponse.text());
                return;
            }

            // Parse JSON responses
            const { entries } = await entriesResponse.json();
            const { squares } = await squaresResponse.json();
            const { userCount } = await usersCountResponse.json();
            const { totalMarks } = await totalMarksResponse.json();
            const { stateCount } = await statesCountResponse.json();

            // Update UI with fetched data
            document.getElementById("entriesCount").textContent = entries.length;
            document.getElementById("usersCount").textContent = userCount;
            document.getElementById("totalMarks").textContent = totalMarks;
            document.getElementById("statesCount").textContent = stateCount;

            // Add markers for entries
            entries.forEach(entry => {
                L.marker([entry.latitude, entry.longitude])
                    .addTo(map)
                    .bindPopup(
                        `<strong>${entry.username}</strong><br>
                        <em>${new Date(entry.timestamp).toLocaleString()}</em><br>
                        ${entry.text}<br>`
                    );
            });

            // Update color map for squares
            squares.forEach(square => {
                if (!userColors[square.username]) {
                    // Adjust the opacity value here as needed
                    userColors[square.username] = square.color || getColorForUsername(square.username, 0.7); // Example: Set opacity to 70%
                }
                colorMap[square.square_id] = userColors[square.username];
            });

            // Sort entries by timestamp in descending order
            entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            // Update "Last Peer" with the most recent entry's username
            if (entries.length > 0) {
                const lastEntry = entries[0];
                document.getElementById("lastPeerName").textContent = lastEntry.username;
            } else {
                console.log("No entries found.");
            }

            // Redraw the grid layer
            map.eachLayer(layer => {
                if (layer instanceof GridLayer) layer.redraw();
            });
        } catch (err) {
            console.error("Error fetching data:", err);
        }
    }

    function getColorForUsername(username, opacity = 1) {
        // Create a more varied hash using bitwise shifting
        let hash = 1;
        for (let i = 0; i < username.length; i++) {
            hash = (hash << 5) - hash + username.charCodeAt(i);
            hash = hash & hash; // Convert to 32-bit integer
        }

        // Use the hash to generate a wider variety of colors
        const hue = Math.abs(hash) % 350; // Full spectrum of colors
        const saturation = 35 + (Math.abs(hash) % 65); // Between 40% and 100%
        const lightness = 25 + (Math.abs(hash) % 60); // Between 25% and 75%

        return `hsla(${hue}, ${saturation}%, ${lightness}%, ${opacity})`;
    }

    initializeMap();
});

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