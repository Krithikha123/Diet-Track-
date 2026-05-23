const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    bmi: {
        type: Number,
        min: 10,
        max: 50
    },
    bmiCategory: {
        type: String,
        enum: ['Underweight', 'Normal weight', 'Overweight', 'Obese']
    },
    lastBMICalculation: {
        type: Date
    },
    height: {
        type: Number,
        required: true,
        min: 100,
        max: 250
    },
    weight: {
        type: Number,
        required: true,
        min: 30,
        max: 300
    },
    age: {
        type: Number,
        required: true,
        min: 13,
        max: 100
    },
    gender: {
        type: String,
        required: true,
        enum: ['male', 'female']
    },
    goal: {
        type: String,
        required: true,
        enum: ['weight gain', 'weight lose', 'maintain']
    },
    activityLevel: {
        type: String,
        enum: ['sedentary', 'light', 'moderate', 'active', 'very active']
    },
    dailyMeals: [{
        type: String,
        enum: ['breakfast', 'lunch', 'dinner', 'snacks']
    }],
    dietTypes: [{
        type: String,
        enum: ['veg', 'non-veg', 'low-carb', 'high-protein', 'vegan', 'keto', 'paleo', 'gluten-free']
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update timestamp on save
userProfileSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('UserProfile', userProfileSchema);