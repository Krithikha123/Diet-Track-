document.addEventListener('DOMContentLoaded', function () {
    const bmiForm = document.getElementById('bmiForm');
    const bmiResult = document.getElementById('bmiResult');
    const calculateAgainBtn = document.getElementById('calculateAgain');

    if (bmiForm) {
        bmiForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const height = parseFloat(document.getElementById('height').value);
            const weight = parseFloat(document.getElementById('weight').value);

            if (height && weight) {
                calculateBMI(height, weight);
            }
        });
    }

    if (calculateAgainBtn) {
        calculateAgainBtn.addEventListener('click', function () {
            bmiResult.style.display = 'none';
            bmiForm.reset();
            document.getElementById('height').focus();
        });
    }

    // Clear form on load
    if (bmiForm) {
        bmiForm.reset();
        document.getElementById('bmiResult').style.display = 'none';
    }
});

function calculateBMI(height, weight) {
    // Convert height from cm to meters
    const heightInMeters = height / 100;

    // Calculate BMI: weight (kg) / height² (m²)
    const bmi = weight / (heightInMeters * heightInMeters);

    // Round to 1 decimal place
    const roundedBMI = Math.round(bmi * 10) / 10;

    // Determine category
    let category = '';
    let interpretation = '';
    let color = '';

    if (bmi < 18.5) {
        category = 'Underweight';
        interpretation = 'You may need to gain some weight. Consider consulting a healthcare provider for advice on healthy weight gain.';
        color = '#2196F3'; // Blue
    } else if (bmi >= 18.5 && bmi < 25) {
        category = 'Normal weight';
        interpretation = 'Congratulations! Your weight is within the healthy range. Maintain your current lifestyle with balanced nutrition and regular exercise.';
        color = '#4CAF50'; // Green
    } else if (bmi >= 25 && bmi < 30) {
        category = 'Overweight';
        interpretation = 'You may need to lose some weight. Consider adjusting your diet and increasing physical activity.';
        color = '#FF9800'; // Orange
    } else {
        category = 'Obese';
        interpretation = 'It is recommended to consult with a healthcare provider for guidance on weight management and lifestyle changes.';
        color = '#F44336'; // Red
    }

    // Update UI
    document.getElementById('bmiValue').textContent = roundedBMI;
    document.getElementById('bmiValue').style.color = color;
    document.getElementById('bmiCategory').textContent = category;
    document.getElementById('bmiCategory').style.color = color;

    // Update interpretation
    const interpretationDiv = document.getElementById('bmiInterpretation');
    interpretationDiv.innerHTML = `
        <p>${interpretation}</p>
        <div class="bmi-details">
            <div class="detail-item">
                <span class="detail-label">Height:</span>
                <span class="detail-value">${height} cm</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Weight:</span>
                <span class="detail-value">${weight} kg</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">BMI:</span>
                <span class="detail-value">${roundedBMI}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Category:</span>
                <span class="detail-value">${category}</span>
            </div>
        </div>
    `;

    // Show result section
    document.getElementById('bmiResult').style.display = 'block';

    // Save to localStorage


    // Save to profile if logged in
    saveBMItoProfile(height, weight, roundedBMI, category);
}

async function saveBMItoProfile(height, weight, bmi, category) {
    try {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user'));

        if (token && user) {
            const response = await fetch('http://localhost:3000/api/profile/save-bmi', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    height,
                    weight,
                    bmi,
                    bmiCategory: category,
                    timestamp: new Date().toISOString()
                })
            });

            if (response.ok) {
                console.log('BMI saved to profile');
            }
        }
    } catch (error) {
        console.error('Error saving BMI:', error);
    }
}