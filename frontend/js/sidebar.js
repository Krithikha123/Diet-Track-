document.addEventListener('DOMContentLoaded', () => {
    // Populate username in header
    const userStr = localStorage.getItem('user');
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            const fullName = user.name || user.username || 'User';
            const headerUsername = document.getElementById('header-username');
            if (headerUsername) {
                headerUsername.textContent = fullName;
            }
        } catch (e) {
            console.error('Error parsing user data from localStorage', e);
        }
    }

    const sidebar = document.querySelector('.sidebar');
    const toggleBtn = document.querySelector('.sidebar-toggle');

    if (sidebar && toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');

            // On mobile, use 'active' class instead for overlay effect if preferred
            if (window.innerWidth <= 768) {
                sidebar.classList.toggle('active');
            }
        });
    }

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 &&
            sidebar.classList.contains('active') &&
            !sidebar.contains(e.target) &&
            !toggleBtn.contains(e.target)) {
            sidebar.classList.remove('active');
        }
    });

    // Optional: Logout functionality if not already handled
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'login.html';
        });
    }
});
