const mongoose = require('mongoose');

const mealLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        default: Date.now,
        required: true
    },
    mealType: {
        type: String,
        enum: ['breakfast', 'lunch', 'dinner', 'snacks'],
        required: true
    },
    foodItems: [{
        foodId: { type: mongoose.Schema.Types.ObjectId, ref: 'Food' },
        name: String,
        quantity: Number,
        calories: Number,
        protein: Number,
        carbs: Number,
        fats: Number,
        iron: Number,
        calcium: Number,
        vitaminA: Number,
        vitaminC: Number,
        vitaminD: Number,
        vitaminB12: Number,
        magnesium: Number,
        zinc: Number,
        fiber: Number
    }],
    totalCalories: Number,
    totalProtein: Number,
    totalCarbs: Number,
    totalFats: Number
}, { timestamps: true });

module.exports = mongoose.model('MealLog', mealLogSchema);