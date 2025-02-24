document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login-form");
    const registerForm = document.getElementById("register-form");
    const showRegister = document.getElementById("show-register");
    const showLogin = document.getElementById("show-login");
    const spinnerOverlay = document.getElementById("spinner-overlay");
    const API_BASE_URL = "https://myt-27ol.onrender.com/api";

    showRegister.addEventListener("click", () => {
        loginForm.style.display = "none";
        registerForm.style.display = "block";
    });

    showLogin.addEventListener("click", () => {
        registerForm.style.display = "none";
        loginForm.style.display = "block";
    });

    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("reg-email").value.trim();
        const username = document.getElementById("reg-username").value.trim(); // Keep case sensitivity
        const password = document.getElementById("reg-password").value;
        const inviter = document.getElementById("inviter").value.trim() || null;

        // Validate fields before sending
        if (!email || !username || !password) {
            alert("All fields are required.");
            return;
        }

        // Ensure no spaces in username, email, or password
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

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const input = document.getElementById("usernameOrEmail").value.trim(); // Keep input as entered
        const password = document.getElementById("password").value;

        // Prevent spaces in input and password
        if (/\s/.test(input) || /\s/.test(password)) {
            alert("Username, email, and password cannot contain spaces.");
            return;
        }

        spinnerOverlay.style.display = 'flex';

        const isEmail = input.includes('@') && input.includes('.'); 

        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    [isEmail ? "email" : "username"]: input, // Keep case-sensitive for username
                    password
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                alert(error.message);
                return;
            }

            localStorage.setItem('currentUser', input);
            window.location.href = 'home.html';
        } catch (err) {
            console.error("Error during login:", err);
            alert("Failed to login. Please try again.");
        } finally {
            spinnerOverlay.style.display = 'none';
        }
    });

});

