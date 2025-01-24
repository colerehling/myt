document.addEventListener("DOMContentLoaded", () => {
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

    const squares = await fetchSquares();
    renderSquares(squares);
  }

  async function fetchSquares() {
    try {
      const response = await fetch(`${API_BASE_URL}/squares`);
      if (!response.ok) {
        throw new Error("Failed to fetch squares");
      }
      const data = await response.json();
      return data.squares;
    } catch (error) {
      console.error("Error fetching squares:", error);
      return [];
    }
  }

  function renderSquares(squares) {
    const squareLayer = L.layerGroup().addTo(map);
    const colorMap = {};

    squares.forEach((square) => {
      if (!colorMap[square.owner]) {
        colorMap[square.owner] = getRandomColor();
      }

      const bounds = [
        [square.y / 20000, square.x / 20000],
        [(square.y + 1) / 20000, (square.x + 1) / 20000]
      ];

      L.rectangle(bounds, {
        color: colorMap[square.owner],
        weight: 1,
        fillOpacity: 0.3
      }).addTo(squareLayer);

      L.marker([square.latitude, square.longitude])
        .addTo(map)
        .bindPopup(`${square.owner}: ${square.text}`);
    });
  }

  function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
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
            `${entry.username}
            ${formattedDate}
            ${entry.text}`
          );
      });
    } catch (err) {
      console.error("Error fetching entries:", err);
    }
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
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });
      if (!response.ok) {
        console.error("Error fetching users:", await response.text());
        return;
      }
      const { users } = await response.json();
      const usersCount = users.length;
      document.getElementById("usersCount").textContent = usersCount;
    } catch (error) {
      console.error("Error fetching the number of users:", error);
    }
  }
  initializeMap();
  fetchAllUsersEntriesCount();
  fetchNumberOfUsers();
  fetchNumberOfUsers();
});

document.addEventListener("DOMContentLoaded", () => {
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
