document.addEventListener("DOMContentLoaded", () => {
    const entryText = document.getElementById("entry-text");
    const mapDiv = document.getElementById("map");
    const API_BASE_URL = "https://myt-27ol.onrender.com/api";
    let currentUser = localStorage.getItem('currentUser');
    let map = null;
  
    if (!currentUser) {
      window.location.href = 'index.html';
    }
  
    async function initializeMap() {
        if (map) return;
        map = L.map(mapDiv).setView([32.7555, -97.3308], 10);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
        }).addTo(map);
      
        // Create a grid layer that updates on map move and zoom
        const gridLayer = L.layerGroup().addTo(map);
      
        function updateGrid() {
          // Clear existing grid
          gridLayer.clearLayers();
      
          const bounds = map.getBounds();
          const squareSize = 0.005; // Approximately 500 meters
      
          // Extend grid creation beyond current view
          const south = Math.floor(bounds.getSouth() / squareSize) * squareSize;
          const north = Math.ceil(bounds.getNorth() / squareSize) * squareSize;
          const west = Math.floor(bounds.getWest() / squareSize) * squareSize;
          const east = Math.ceil(bounds.getEast() / squareSize) * squareSize;
          
      
          // Create horizontal lines
          for (let lat = south; lat <= north; lat += squareSize) {
            L.polyline([
              [lat, west],
              [lat, east]
            ], {
              color: '#000',
              weight: 1,
              opacity: 0.05
            }).addTo(gridLayer);
          }
      
          // Create vertical lines
          for (let lng = west; lng <= east; lng += squareSize) {
            L.polyline([
              [south, lng],
              [north, lng]
            ], {
              color: '#000',
              weight: 1,
              opacity: 0.05
            }).addTo(gridLayer);
          }
        }
      
        // Initial grid
        updateGrid();
      
        // Update grid on map move and zoom
        map.on('moveend', updateGrid);
      
        await loadAllEntries();
        await loadSquareOwnership();
      }
      
  
    function createGrid(bounds, squareSize) {
        console.log("Creating grid with bounds:", bounds);
        console.log("Square size:", squareSize);
        
        const grid = [];
        const north = bounds.getNorth();
        const south = bounds.getSouth();
        const east = bounds.getEast();
        const west = bounds.getWest();
      
        console.log("North:", north, "South:", south, "East:", east, "West:", west);
      
        for (let lat = south; lat <= north; lat += squareSize) {
          for (let lng = west; lng <= east; lng += squareSize) {
            const square = turf.square([lng, lat, lng + squareSize, lat + squareSize]);
            console.log("Created square:", square);
            grid.push(square);
          }
        }
      
        console.log("Total grid squares:", grid.length);
        return grid;
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
              `<span class="math-inline">\{entry\.username\}<br\></span>{formattedDate}<br>${entry.text}`
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
        updateSquareColors(squares);
      } catch (err) {
        console.error("Error fetching square ownership:", err);
      }
    }
  
    function updateSquareColors(squares) {
        const colorMap = {};
        const mostRecentEntries = {};
        const squareSize = 0.005;
      
        // Find the most recent entry for each square
        squares.forEach(square => {
          const squareKey = `${Math.floor(square.latitude / squareSize)}_${Math.floor(square.longitude / squareSize)}`;
          
          // Only update if this entry is more recent
          if (!mostRecentEntries[squareKey] || 
              new Date(square.timestamp) > new Date(mostRecentEntries[squareKey].timestamp)) {
            mostRecentEntries[squareKey] = square;
          }
        });
      
        // Create color map based on most recent entries
        Object.values(mostRecentEntries).forEach(square => {
          const lat = Math.floor(square.latitude / squareSize) * squareSize;
          const lng = Math.floor(square.longitude / squareSize) * squareSize;
          const key = `${lat},${lng}`;
          colorMap[key] = getColorForUsername(square.username);
        });
      
        // Color the grid squares
        map.eachLayer(layer => {
          if (layer instanceof L.Polygon) {
            const bounds = layer.getBounds();
            const key = `${bounds.getSouth()},${bounds.getWest()}`;
            if (colorMap[key]) {
              layer.setStyle({ 
                fillColor: colorMap[key], 
                fillOpacity: 0.3,
                color: colorMap[key],  // Border color
                weight: 1
              });
            }
          }
        });
      }
      
  
    function getColorForUsername(username) {
      let hash = 0;
      for (let i = 0; i < username.length; i++) {
        hash = username.charCodeAt(i) + ((hash << 5) - hash);
      }
      const color = Math.floor(Math.abs(Math.sin(hash) * 16777215)).toString(16);
      return '#' + '0'.repeat(6 - color.length) + color;
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
  
    initializeMap();
    fetchAllUsersEntriesCount();
    fetchNumberOfUsers();
  
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
  