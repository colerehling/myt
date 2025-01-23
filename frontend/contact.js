function submitForm(event) {
            event.preventDefault();
            
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const subject = document.getElementById('subject').value;
            const message = document.getElementById('message').value;

            // Basic form validation
            if (!name || !email || !subject || !message) {
                alert('Please fill out all fields');
                return;
            }

            // In a real-world scenario, you'd send this to a backend
            alert('Message sent successfully! We will get back to you soon.');
            
            // Optional: Reset form after submission
            event.target.reset();
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