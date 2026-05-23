const express = require('express');
const router = express.Router();
const Exercise = require('../models/Exercise');
const WorkoutPlan = require('../models/WorkoutPlan');
const { verifyToken } = require('./auth');

// Get all exercises
router.get('/exercises', verifyToken, async (req, res) => {
    try {
        const exercises = await Exercise.find({});
        res.json({
            success: true,
            count: exercises.length,
            exercises: exercises
        });
    } catch (error) {
        console.error('Error fetching exercises:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching exercises',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Save current workout plan
router.post('/save-plan', verifyToken, async (req, res) => {
    try {
        const { warmup, strength, cardio, cooldown } = req.body;
        const weekStart = new Date();
        weekStart.setHours(0, 0, 0, 0);

        let plan = await WorkoutPlan.findOne({ userId: req.userId });

        if (plan) {
            plan.warmup = warmup;
            plan.strength = strength;
            plan.cardio = cardio;
            plan.cooldown = cooldown;
            plan.totals = {
                exercises: (warmup?.length || 0) + (strength?.length || 0) + (cardio?.length || 0) + (cooldown?.length || 0),
                calories: (warmup || []).concat(strength || [], cardio || [], cooldown || []).reduce((sum, ex) => sum + (ex.calories || 0) * (ex.duration || 0), 0),
                duration: (warmup || []).concat(strength || [], cardio || [], cooldown || []).reduce((sum, ex) => sum + (ex.duration || 0), 0)
            };
            plan.updatedAt = Date.now();
            await plan.save();
        } else {
            const totals = {
                exercises: (warmup?.length || 0) + (strength?.length || 0) + (cardio?.length || 0) + (cooldown?.length || 0),
                calories: (warmup || []).concat(strength || [], cardio || [], cooldown || []).reduce((sum, ex) => sum + (ex.calories || 0) * (ex.duration || 0), 0),
                duration: (warmup || []).concat(strength || [], cardio || [], cooldown || []).reduce((sum, ex) => sum + (ex.duration || 0), 0)
            };
            plan = new WorkoutPlan({
                userId: req.userId,
                warmup,
                strength,
                cardio,
                cooldown,
                totals,
                weekStart
            });
            await plan.save();
        }

        res.json({ success: true, message: 'Workout plan saved successfully', data: plan });
    } catch (error) {
        console.error('Error saving workout plan:', error);
        res.status(500).json({ success: false, message: 'Server error while saving plan' });
    }
});

// Get current workout plan
router.get('/current-plan', verifyToken, async (req, res) => {
    try {
        const plan = await WorkoutPlan.findOne({ userId: req.userId });
        if (!plan) {
            return res.json({ success: false, message: 'No workout plan found' });
        }
        res.json({ success: true, data: plan });
    } catch (error) {
        console.error('Error fetching workout plan:', error);
        res.status(500).json({ success: false, message: 'Server error while fetching plan' });
    }
});

// Update the weekStart of the current workout plan
router.post('/update-week', verifyToken, async (req, res) => {
    try {
        const plan = await WorkoutPlan.findOne({ userId: req.userId });
        if (!plan) {
            return res.status(404).json({ success: false, message: 'No workout plan found' });
        }

        const newWeekStart = new Date();
        newWeekStart.setHours(0, 0, 0, 0);

        plan.weekStart = newWeekStart;
        await plan.save();

        res.json({ success: true, message: 'Workout week updated successfully', data: plan });
    } catch (error) {
        console.error('Error updating workout week:', error);
        res.status(500).json({ success: false, message: 'Server error while updating week' });
    }
});

// Update a logged exercise in the active workout plan
router.post('/log-exercise', verifyToken, async (req, res) => {
    try {
        const { dateKey, logData } = req.body;

        const plan = await WorkoutPlan.findOne({ userId: req.userId });

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: 'No active workout plan found'
            });
        }

        // Initialize loggedExercises if it doesn't exist
        if (!plan.loggedExercises) {
            plan.loggedExercises = {};
        }

        // Save log data for the specific day
        // logData can be an array of exercises or a single one depending on how we want to store it
        // To match DietPlan's structure (where dateKey maps to a food object), 
        // but here one date might have multiple exercises.
        // Actually, DietPlan's loggedMeals[mealType][dateKey] = logData.
        // For workout, let's use loggedExercises[dateKey] = [exercises]

        if (!plan.loggedExercises[dateKey]) {
            plan.loggedExercises[dateKey] = [];
        }

        // Merge logic: If logData is an array (Log Day), we handle it differently than single log
        const newLogs = Array.isArray(logData) ? logData : [logData];

        const existingLogs = plan.loggedExercises[dateKey];

        newLogs.forEach(newLog => {
            // Find if this category already has a log for this day
            const existingIndex = existingLogs.findIndex(l => l.category === newLog.category);
            if (existingIndex !== -1) {
                // Update existing category log
                existingLogs[existingIndex] = newLog;
            } else {
                // Add new category log
                existingLogs.push(newLog);
            }
        });

        plan.loggedExercises[dateKey] = existingLogs;

        // Mark as modified
        plan.markModified('loggedExercises');
        await plan.save();

        res.json({
            success: true,
            message: 'Workout logged to plan successfully',
            data: plan
        });
    } catch (error) {
        console.error('Error logging workout to plan:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while logging workout to plan'
        });
    }
});

module.exports = router;
