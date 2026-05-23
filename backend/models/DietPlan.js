const mongoose = require('mongoose');

const dietPlanSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        default: 'custom'
    },
    selectedFoods: {
        breakfast: [Object],
        lunch: [Object],
        dinner: [Object],
        snacks: [Object]
    },
    totals: {
        calories: Number,
        protein: Number,
        carbs: Number,
        fats: Number
    },
    profile: Object,
    date: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true
    },
    loggedMeals: {
        type: Object,
        default: {
            breakfast: {},
            lunch: {},
            dinner: {},
            snacks: {}
        }
    },
    weekStart: {
        type: Date,
        default: () => {
            const d = new Date();
            d.setHours(0, 0, 0, 0);
            return d;
        }
    }
}, { timestamps: true });

module.exports = mongoose.model('DietPlan', dietPlanSchema);
