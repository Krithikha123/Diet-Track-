const mongoose = require('mongoose');

const workoutPlanSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    warmup: [{
        id: String,
        name: String,
        calories: Number,
        duration: Number
    }],
    strength: [{
        id: String,
        name: String,
        calories: Number,
        duration: Number
    }],
    cardio: [{
        id: String,
        name: String,
        calories: Number,
        duration: Number
    }],
    cooldown: [{
        id: String,
        name: String,
        calories: Number,
        duration: Number
    }],
    totals: {
        exercises: Number,
        calories: Number,
        duration: Number
    },
    loggedExercises: {
        type: Object,
        default: {}
    },
    updatedAt: {
        type: Date,
        default: Date.now
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

module.exports = mongoose.model('WorkoutPlan', workoutPlanSchema);
