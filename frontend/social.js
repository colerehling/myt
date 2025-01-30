document.addEventListener("DOMContentLoaded", async () => {
    const container = document.getElementById("entries-container");

    try {
        const response = await fetch("https://myt-27ol.onrender.com/api/recent-entries");
        const data = await response.json();

        if (!data.success || data.entries.length === 0) {
            container.innerHTML = "<p>No recent entries found.</p>";
            return;
        }

        container.innerHTML = ""; // Clear loading text

        data.entries.forEach(entry => {
            const entryBox = document.createElement("div");
            entryBox.classList.add("entry-box");

            entryBox.innerHTML = `
                <h3>${entry.username}</h3>
                <p><strong>Time:</strong> ${new Date(entry.timestamp).toLocaleString()}</p>
                <p><strong>State:</strong> ${entry.state || "Unknown"}</p>
                <p>${entry.text}</p>
            `;

            container.appendChild(entryBox);
        });
    } catch (error) {
        console.error("Error loading entries:", error);
        container.innerHTML = "<p>Failed to load recent entries.</p>";
    }
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
