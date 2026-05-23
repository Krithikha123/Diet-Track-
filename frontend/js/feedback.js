const API_BASE_URL = 'http://localhost:3000';
let currentRating = 0;

document.addEventListener('DOMContentLoaded', () => {
    setupStarRating();
    loadFeedbackHistory();
});

function setupStarRating() {
    const stars = document.querySelectorAll('#starRating i');
    const ratingInput = document.getElementById('ratingValue');

    stars.forEach(star => {
        star.addEventListener('mouseover', function () {
            const rating = this.dataset.rating;
            highlightStars(rating);
        });

        star.addEventListener('mouseout', function () {
            highlightStars(currentRating);
        });

        star.addEventListener('click', function () {
            currentRating = parseInt(this.dataset.rating);
            ratingInput.value = currentRating;
            highlightStars(currentRating);
        });
    });
}

function highlightStars(rating) {
    const stars = document.querySelectorAll('#starRating i');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.className = 'fas fa-star';
        } else {
            star.className = 'far fa-star';
        }
    });
}

async function submitFeedback() {
    const rating = document.getElementById('ratingValue').value;
    const category = document.getElementById('feedbackCategory').value;
    const message = document.getElementById('feedbackMessage').value.trim();

    if (rating === '0') {
        alert('Please select a rating');
        return;
    }

    if (!message) {
        alert('Please enter your feedback message');
        return;
    }

    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${API_BASE_URL}/api/feedback/submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ rating, category, message })
        });

        const result = await response.json();
        if (result.success) {
            alert('✅ Thank you for your feedback!');

            // Clear form
            document.getElementById('ratingValue').value = '0';
            document.getElementById('feedbackMessage').value = '';
            currentRating = 0;
            highlightStars(0);

            // Reload feedback history
            loadFeedbackHistory();
        } else {
            alert('❌ Failed to submit feedback');
        }
    } catch (error) {
        console.error('Error submitting feedback:', error);
        alert('❌ Network error');
    }
}

async function loadFeedbackHistory() {
    const historyDiv = document.getElementById('feedbackHistory');
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_BASE_URL}/api/feedback/my-feedback`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();

        if (result.success && result.data.length > 0) {
            let html = '';
            result.data.forEach(item => {
                const date = new Date(item.createdAt).toLocaleDateString();
                const stars = '★'.repeat(item.rating) + '☆'.repeat(5 - item.rating);

                html += `
                    <div class="feedback-item">
                        <div class="feedback-rating">${stars}</div>
                        <span class="feedback-category">${item.category}</span>
                        <span class="feedback-date">${date}</span>
                        <p>${item.message}</p>
                        ${item.adminResponse ? `
                            <div class="admin-response">
                                <strong>Admin Response:</strong>
                                <p>${item.adminResponse}</p>
                            </div>
                        ` : ''}
                        <small>Status: ${item.status}</small>
                    </div>
                `;
            });
            historyDiv.innerHTML = html;
        } else {
            historyDiv.innerHTML = '<p>No feedback submitted yet.</p>';
        }
    } catch (error) {
        console.error('Error loading feedback:', error);
        historyDiv.innerHTML = '<p>Error loading feedback history.</p>';
    }
}

// Make functions globally available
window.submitFeedback = submitFeedback;