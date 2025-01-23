document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login-form");
    const registerForm = document.getElementById("register-form");
    const showRegister = document.getElementById("show-register");
    const showLogin = document.getElementById("show-login");

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
        const email = document.getElementById("reg-email").value;
        const username = document.getElementById("reg-username").value;
        const password = document.getElementById("reg-password").value;

        // Validate fields before sending
        if (!email || !username || !password) {
            alert("All fields are required.");
            return;
        }

        // Validate username length
        if (username.length < 4 || username.length > 30) {
            alert("Username must be between 4 and 30 characters long.");
            return;
        }

        // Validate password length
        if (password.length < 8 || password.length > 30) {
            alert("Password must be between 8 and 30 characters long.");
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, username, password }),
            });

            if (!response.ok) {
                const error = await response.json();
                alert(error.message);
                return;
            }

            alert("Registration successful!");
            showLogin.click();
        } catch (err) {
            console.error("Error during registration:", err);
            alert("Failed to register. Please try again.");
        }
    });

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;

        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            if (!response.ok) {
                const error = await response.json();
                alert(error.message);
                return;
            }

            // Store the username in localStorage or sessionStorage
            localStorage.setItem('currentUser', username);
            
            // Redirect to home page
            window.location.href = 'home.html';
        } catch (err) {
            console.error("Error during login:", err);
            alert("Failed to login. Please try again.");
        }
    });
});
