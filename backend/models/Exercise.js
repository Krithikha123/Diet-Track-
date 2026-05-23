const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Exercise name is required'],
        trim: true,
        unique: true,
        index: true
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: ['strength', 'cardio', 'flexibility', 'balance', 'hiit', 'plyometric', 'warmup', 'cooldown'],
        default: 'strength'
    },
    muscleGroups: [{
        type: String,
        enum: [
            'chest', 'back', 'shoulders', 'biceps', 'triceps',
            'quadriceps', 'hamstrings', 'calves', 'glutes', 'abs',
            'core', 'full_body', 'upper_body', 'lower_body', 'hips'
        ]
    }],
    difficulty: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        default: 'intermediate'
    },
    equipment: [{
        type: String,
        enum: [
            'none', 'dumbbells', 'barbell', 'kettlebell', 'resistance_band',
            'yoga_mat', 'pull_up_bar', 'bench', 'treadmill', 'bike',
            'elliptical', 'machine', 'swiss_ball', 'foam_roller'
        ]
    }],
    caloriesPerMin: {
        type: Number,
        required: [true, 'Calories per minute is required'],
        min: [0, 'Calories cannot be negative'],
        default: 5
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    instructions: {
        type: String,
        trim: true,
        maxlength: [2000, 'Instructions cannot exceed 2000 characters']
    },
    videoUrl: {
        type: String,
        trim: true,
        match: [
            /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
            'Please enter a valid URL'
        ]
    },
    imageUrl: {
        type: String,
        trim: true
    },
    commonMistakes: [{
        type: String,
        trim: true
    }],
    safetyTips: [{
        type: String,
        trim: true
    }],
    variations: [{
        name: { type: String, trim: true },
        difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'] },
        description: { type: String, trim: true }
    }],
    isDefault: {
        type: Boolean,
        default: false
    },
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Create text index for search
exerciseSchema.index({ name: 'text', description: 'text' });

// Compound index for common queries
exerciseSchema.index({ category: 1, difficulty: 1 });
exerciseSchema.index({ muscleGroups: 1 });

// Virtual for estimated calories based on duration
exerciseSchema.virtual('estimatedCalories').get(function (durationMinutes) {
    return this.caloriesPerMin * (durationMinutes || 1);
});

// Method to get formatted muscle groups
exerciseSchema.methods.getMuscleGroupsString = function () {
    return this.muscleGroups.join(', ');
};

module.exports = mongoose.model('Exercise', exerciseSchema);