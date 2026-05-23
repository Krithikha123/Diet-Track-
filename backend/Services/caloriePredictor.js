// Simple Linear Regression implementation for calorie prediction

class LinearRegression {
    constructor() {
        this.weights = [];
        this.bias = 0;
        this.learningRate = 0.01;
        this.iterations = 1000;
    }

    // Normalize features
    normalize(features) {
        const means = [];
        const stds = [];

        for (let i = 0; i < features[0].length; i++) {
            const col = features.map(row => row[i]);
            const mean = col.reduce((a, b) => a + b, 0) / col.length;
            const std = Math.sqrt(col.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / col.length);
            means.push(mean);
            stds.push(std || 1);
        }

        return {
            normalized: features.map(row =>
                row.map((val, i) => (val - means[i]) / stds[i])
            ),
            means,
            stds
        };
    }

    // Train the model
    train(features, targets) {
        const { normalized, means, stds } = this.normalize(features);
        this.featureMeans = means;
        this.featureStds = stds;

        const m = normalized.length;
        const n = normalized[0].length;

        this.weights = new Array(n).fill(0);
        this.bias = 0;

        // Gradient descent
        for (let iter = 0; iter < this.iterations; iter++) {
            let predictions = normalized.map(row =>
                row.reduce((sum, val, i) => sum + val * this.weights[i], 0) + this.bias
            );

            // Calculate gradients
            let dw = new Array(n).fill(0);
            let db = 0;

            for (let i = 0; i < m; i++) {
                const error = predictions[i] - targets[i];
                for (let j = 0; j < n; j++) {
                    dw[j] += error * normalized[i][j];
                }
                db += error;
            }

            // Update weights
            for (let j = 0; j < n; j++) {
                this.weights[j] -= (this.learningRate * dw[j]) / m;
            }
            this.bias -= (this.learningRate * db) / m;
        }

        return this;
    }

    // Predict calories
    predict(features) {
        // Normalize input features
        const normalized = features.map((val, i) =>
            (val - this.featureMeans[i]) / this.featureStds[i]
        );

        const prediction = normalized.reduce(
            (sum, val, i) => sum + val * this.weights[i], 0
        ) + this.bias;

        return Math.max(1200, Math.min(4000, Math.round(prediction)));
    }
}

// Global model instance
let globalModel = null;

// Train model on population data
function initializeModel() {
    // Sample training data: [height, weight, age, gender, activity, goal]
    const features = [
        [170, 70, 25, 1, 3, 0],   // Male, maintain
        [165, 65, 30, 0, 2, -1],  // Female, lose weight
        [180, 80, 28, 1, 4, 1],   // Male, gain weight
        [160, 55, 22, 0, 3, 0],   // Female, maintain
        [175, 75, 35, 1, 2, -1],  // Male, lose weight
        [168, 68, 40, 0, 1, 1],   // Female, gain weight
        [172, 72, 29, 1, 5, 1],   // Male, gain weight (active)
        [162, 58, 27, 0, 4, -1],  // Female, lose weight (active)
        [178, 78, 45, 1, 2, 0],   // Male, maintain
        [158, 52, 33, 0, 3, -1],  // Female, lose weight
    ];

    // Target calories (calculated using Mifflin-St Jeor as base)
    const targets = [
        2500, 2000, 2800, 1900, 2200, 2100, 3000, 2300, 2400, 1800
    ];

    const model = new LinearRegression();
    model.train(features, targets);

    return model;
}

// Get or initialize model
function getModel() {
    if (!globalModel) {
        globalModel = initializeModel();
    }
    return globalModel;
}

// Predict calories for a user
function predictCalories(userProfile) {
    const model = getModel();

    // Map activity level (assuming 1-5 scale)
    const activityMap = {
        'sedentary': 1,
        'lightly active': 2,
        'moderately active': 3,
        'very active': 4,
        'extremely active': 5
    };

    // Map goal to numeric
    const goalMap = {
        'weight lose': -1,
        'maintain': 0,
        'weight gain': 1
    };

    const features = [
        userProfile.height || 170,
        userProfile.weight || 70,
        userProfile.age || 30,
        userProfile.gender === 'male' ? 1 : 0,
        activityMap[userProfile.activityLevel] || 3,
        goalMap[userProfile.goal] || 0
    ];

    return model.predict(features);
}

module.exports = { predictCalories };