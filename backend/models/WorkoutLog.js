const mongoose = require('mongoose');

const workoutLogSchema = new mongoose.Schema({
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
    workoutType: {
        type: String,
        enum: ['cardio', 'strength', 'flexibility', 'other'],
        required: true
    },
    duration: Number,      // minutes
    caloriesBurned: Number,
    exercises: [{
        name: String,
        sets: Number,
        reps: Number,
        weight: Number
    }]
}, { timestamps: true });

module.exports = mongoose.model('WorkoutLog', workoutLogSchema);