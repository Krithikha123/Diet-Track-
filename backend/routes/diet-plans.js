const express = require('express');
const router = express.Router();
const DietPlan = require('../models/DietPlan');
const { verifyToken } = require('./auth');

// Save a custom diet plan
router.post('/save', verifyToken, async (req, res) => {
    try {
        const { name, type, selectedFoods, totals, profile } = req.body;

        // Deactivate previous plans for this user if any
        await DietPlan.updateMany({ userId: req.userId, isActive: true }, { isActive: false });

        const weekStart = new Date();
        weekStart.setHours(0, 0, 0, 0);

        const newPlan = new DietPlan({
            userId: req.userId,
            name,
            type,
            selectedFoods,
            totals,
            profile,
            isActive: true,
            weekStart: weekStart
        });

        await newPlan.save();

        res.status(201).json({
            success: true,
            message: 'Diet plan saved successfully',
            data: newPlan
        });
    } catch (error) {
        console.error('Error saving diet plan:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while saving diet plan',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get current active diet plan
router.get('/current', verifyToken, async (req, res) => {
    try {
        const plan = await DietPlan.findOne({ userId: req.userId, isActive: true }).sort({ createdAt: -1 });

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: 'No active diet plan found'
            });
        }

        res.json({
            success: true,
            data: plan
        });
    } catch (error) {
        console.error('Error fetching current diet plan:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching diet plan'
        });
    }
});

// Update a logged meal in the active diet plan
router.post('/log-meal', verifyToken, async (req, res) => {
    try {
        const { mealType, dateKey, logData } = req.body;

        const plan = await DietPlan.findOne({ userId: req.userId, isActive: true });

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: 'No active diet plan found'
            });
        }

        // Initialize loggedMeals if it doesn't exist (safety)
        if (!plan.loggedMeals) {
            plan.loggedMeals = {
                breakfast: {},
                lunch: {},
                dinner: {},
                snacks: {}
            };
        }

        // Initialize specific meal category if it doesn't exist
        if (!plan.loggedMeals[mealType]) {
            plan.loggedMeals[mealType] = {};
        }

        // Save log data for the specific day
        plan.loggedMeals[mealType][dateKey] = logData;

        // Mark as modified so Mongoose knows to save the nested object
        plan.markModified('loggedMeals');
        await plan.save();

        res.json({
            success: true,
            message: 'Meal logged to plan successfully',
            data: plan
        });
    } catch (error) {
        console.error('Error logging meal to plan:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while logging meal to plan'
        });
    }
});

// Update the weekStart of the current active plan
router.post('/update-week', verifyToken, async (req, res) => {
    try {
        const plan = await DietPlan.findOne({ userId: req.userId, isActive: true });
        if (!plan) {
            return res.status(404).json({ success: false, message: 'No active diet plan found' });
        }

        const newWeekStart = new Date();
        newWeekStart.setHours(0, 0, 0, 0);

        plan.weekStart = newWeekStart;
        await plan.save();

        res.json({ success: true, message: 'Plan week updated successfully', data: plan });
    } catch (error) {
        console.error('Error updating plan week:', error);
        res.status(500).json({ success: false, message: 'Server error while updating week' });
    }
});

module.exports = router;
