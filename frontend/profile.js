const API_BASE_URL = "https://myt-27ol.onrender.com/api";

// Handle username change request
document.getElementById("changeUsernameBtn").addEventListener("click", async () => {
    const newUsername = document.getElementById("newUsername").value.trim();
    const currentUsername = localStorage.getItem("currentUser");
    const messageEl = document.getElementById("usernameChangeMessage");
  
    if (!newUsername) {
      messageEl.textContent = "Please enter a new username.";
      return;
    }
  
    try {
      const response = await fetch(`${API_BASE_URL}/change-username`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentUsername, newUsername }),
      });
  
      const data = await response.json();
      if (data.success) {
        messageEl.textContent = "Username changed successfully!";
        localStorage.setItem("currentUser", newUsername); // Update stored username
      } else {
        messageEl.textContent = data.message;
      }
    } catch (error) {
      console.error("Error changing username:", error);
      messageEl.textContent = "An error occurred.";
    }
  });  

document.addEventListener("DOMContentLoaded", () => {
    const userDetailsDiv = document.getElementById("user-details");
    const currentUser = localStorage.getItem('currentUser');

    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }

    userDetailsDiv.textContent = `${currentUser}`;

    fetch(`${API_BASE_URL}/entries?username=${currentUser}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const entries = data.entries;
                const entriesCount = entries.length;
                const lastEntry = entries.reduce((latest, current) => 
                    new Date(current.timestamp) > new Date(latest.timestamp) ? current : latest, entries[0]
                );

                const lastEntryDate = lastEntry ? new Date(lastEntry.timestamp) : null;
                const totalEntries = entries.length > 0 ? entries[0].total_entries : 0;

                document.getElementById("entriesCount").textContent = entriesCount;
                document.getElementById("lastEntryDate").textContent = lastEntryDate ? lastEntryDate.toLocaleString() : "No entries";
                document.getElementById("totalEntries").textContent = totalEntries;
            } else {
                console.error('Failed to fetch user entries:', data.message);
            }
        })
        .catch(error => console.error('Error fetching user entries:', error));

    // Removed cooldown check function
});

// Hamburger menu handling
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


