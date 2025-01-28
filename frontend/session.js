let inactivityTimer;

function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(logout, 600000); // 10 minutes
}

function logout() {
    fetch('http://localhost:3000/api/logout', {
        method: 'POST',
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            localStorage.removeItem('currentUser');
            window.location.href = 'index.html'; // Redirect to login page
        }
    })
    .catch(error => console.error('Error:', error));
}

// Reset the timer on any user activity
document.addEventListener('mousemove', resetInactivityTimer);
document.addEventListener('keypress', resetInactivityTimer);

// Initial setup
resetInactivityTimer();

// Periodically check session status
setInterval(() => {
    fetch('http://localhost:3000/api/check-session', {
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (!data.loggedIn) {
            localStorage.removeItem('currentUser');
            window.location.href = 'index.html'; // Redirect to login page
        }
    })
    .catch(error => console.error('Error:', error));
}, 60000); // Check every minute