
document.addEventListener('DOMContentLoaded', () => {
    // Initial Data (In a real app, this would be fetched from an API)
    let waterConsumed = 5;
    let waterTarget = 8;

    // Initialize Charts
    initWorkoutChart();
    initWeeklyProgressChart();

    // Water Intake Logic
    const addGlassBtn = document.getElementById('addGlassBtn');
    if (addGlassBtn) {
        addGlassBtn.addEventListener('click', () => {
            if (waterConsumed < waterTarget) {
                waterConsumed++;
                updateWaterUI();
            }
        });
    }

    function updateWaterUI() {
        document.getElementById('waterConsumed').textContent = waterConsumed;
        const waterIcons = document.getElementById('waterIcons');
        waterIcons.innerHTML = '';

        for (let i = 0; i < waterTarget; i++) {
            const drop = document.createElement('i');
            drop.className = `fas fa-tint water-drop ${i < waterConsumed ? 'filled' : ''}`;
            waterIcons.appendChild(drop);
        }
    }

    function initWorkoutChart() {
        const ctx = document.getElementById('miniWorkoutChart');
        if (!ctx) return;

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
                datasets: [{
                    label: 'Calories',
                    data: [60, 80, 45, 90, 70, 100, 85],
                    backgroundColor: '#4CAF50',
                    borderRadius: 5,
                    barThickness: 8
                }, {
                    label: 'Workouts',
                    type: 'line',
                    data: [40, 60, 55, 75, 65, 80, 70],
                    borderColor: '#2196F3',
                    borderWidth: 2,
                    pointRadius: 3,
                    fill: false,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { display: true, grid: { display: false }, ticks: { font: { size: 10 } } },
                    y: { display: false }
                }
            }
        });
    }

    function initWeeklyProgressChart() {
        const ctx = document.getElementById('weeklyProgressChart');
        if (!ctx) return;

        const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 200);
        gradient.addColorStop(0, 'rgba(33, 150, 243, 0.2)');
        gradient.addColorStop(1, 'rgba(33, 150, 243, 0)');

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Progress',
                    data: [65, 66, 65.5, 67, 66.5, 68, 67.5],
                    borderColor: '#2196F3',
                    borderWidth: 3,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: '#2196F3',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    fill: true,
                    backgroundColor: gradient,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { display: false } },
                    y: { display: false }
                }
            }
        });
    }

    // Attempt to load real user data if available from other scripts
    loadUserData();
});

async function loadUserData() {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            document.getElementById('userName').textContent = user.name;
            document.getElementById('userNameHeader').textContent = user.name;
            // Fetch more details from existing API if needed
        }
    } catch (e) {
        console.error("Error loading user data:", e);
    }
}
