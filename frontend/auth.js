document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login-form");
    const registerContainer = document.getElementById("register-container");
    const registerForm = document.getElementById("register-form"); // Define registerForm here
    const showRegister = document.getElementById("show-register");
    const showLogin = document.getElementById("show-login");
    const spinnerOverlay = document.getElementById("spinner-overlay");
    const API_BASE_URL = "https://myt-27ol.onrender.com/api";

    showRegister.addEventListener("click", () => {
        loginForm.style.display = "none";
        registerContainer.style.display = "block"; // Toggle the container
    });

    showLogin.addEventListener("click", () => {
        registerContainer.style.display = "none"; // Toggle the container
        loginForm.style.display = "block";
    });

    // Ensure registerForm is defined before adding the event listener
    if (registerForm) {
        registerForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = document.getElementById("reg-email").value.trim();
            const username = document.getElementById("reg-username").value.trim();
            const password = document.getElementById("reg-password").value;
            const inviter = document.getElementById("inviter").value.trim() || null;

            // Validate fields before sending
            if (!email || !username || !password) {
                alert("All fields are required.");
                return;
            }

            // Prevent spaces in username, email, or password during registration
            if (/\s/.test(username) || /\s/.test(email) || /\s/.test(password)) {
                alert("Username, email, and password cannot contain spaces.");
                return;
            }

            // Validate username length
            if (username.length < 4 || username.length > 30) {
                alert("Username must be between 4 and 30 characters long.");
                return;
            }

            // Validate password length
            if (password.length < 8 || password.length > 25) {
                alert("Password must be between 8 and 25 characters long.");
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/register`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, username, password, inviter }),
                });

                if (!response.ok) {
                    const error = await response.json();
                    alert(error.message);
                    return;
                }

                alert("Registration successful!");

                // Automatically log the user in after registration
                const loginResponse = await fetch(`${API_BASE_URL}/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, password }),
                });

                if (!loginResponse.ok) {
                    const error = await loginResponse.json();
                    alert(`Login failed: ${error.message}`);
                    return;
                }

                // Store the exact username in localStorage
                localStorage.setItem('currentUser', username);

                // Redirect to the how_to page
                window.location.href = 'how_to.html';
            } catch (err) {
                console.error("Error during registration or login:", err);
                alert("An error occurred. Please try again.");
            }
        });
    } else {
        console.error("Register form not found!");
    }

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const input = document.getElementById("usernameOrEmail").value.trim();
        const password = document.getElementById("password").value;

        spinnerOverlay.style.display = 'flex';

        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: input,
                    password
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                alert(error.message);
                return;
            }

            const data = await response.json();
            localStorage.setItem('currentUser', data.username);
            window.location.href = 'home.html';
        } catch (err) {
            console.error("Error during login:", err);
            alert("Failed to login. Please try again.");
        } finally {
            spinnerOverlay.style.display = 'none';
        }
    });
});