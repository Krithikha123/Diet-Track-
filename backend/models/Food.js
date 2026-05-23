const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    category: {
        type: String,
        required: true,
        enum: ['breakfast', 'lunch', 'dinner', 'snacks']
    },
    dietTypes: [{
        type: String,
        enum: ['veg', 'non-veg', 'low-carb', 'high-protein', 'vegan', 'keto', 'paleo', 'gluten-free']
    }],
    calories: {
        type: Number,
        required: true,
        min: 0
    },
    protein: {
        type: Number,
        required: true,
        min: 0
    },
    carbs: {
        type: Number,
        required: true,
        min: 0
    },
    fats: {
        type: Number,
        required: true,
        min: 0
    },
    fiber: {
        type: Number,
        default: 0,
        min: 0
    },
    iron: {
        type: Number,
        default: 0,
        min: 0
    },
    calcium: {
        type: Number,
        default: 0,
        min: 0
    },
    vitaminA: {
        type: Number,
        default: 0,
        min: 0
    },
    vitaminC: {
        type: Number,
        default: 0,
        min: 0
    },
    vitaminD: {
        type: Number,
        default: 0,
        min: 0
    },
    vitaminB12: {
        type: Number,
        default: 0,
        min: 0
    },
    magnesium: {
        type: Number,
        default: 0,
        min: 0
    },
    zinc: {
        type: Number,
        default: 0,
        min: 0
    },
    sugar: {
        type: Number,
        default: 0,
        min: 0
    },
    servingSize: {
        type: String,
        default: '1 serving'
    },
    imageUrl: {
        type: String,
        default: ''
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update timestamp before saving
foodSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Food', foodSchema);