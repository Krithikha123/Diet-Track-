const express = require('express');
const router = express.Router();
const UserProfile = require('../models/UserProfile');
const { verifyToken } = require('./auth');

// Save or update user profile
router.post('/save', verifyToken, async (req, res) => {
    try {
        console.log('Profile save request from user:', req.userId);

        const {
            height,
            weight,
            age,
            gender,
            goal,
            activityLevel,
            dailyMeals = [],
            dietTypes = []
        } = req.body;

        if (!height || !weight || !age || !gender || !goal || !activityLevel) {
            return res.status(400).json({
                message: 'Please fill all required fields: height, weight, age, gender, goal, activity level'
            });
        }

        // Check if profile already exists
        let profile = await UserProfile.findOne({ userId: req.userId });

        if (profile) {
            // Update existing profile
            profile.height = height;
            profile.weight = weight;
            profile.age = age;
            profile.gender = gender;
            profile.goal = goal;
            profile.activityLevel = activityLevel;
            profile.dailyMeals = dailyMeals;
            profile.dietTypes = dietTypes;
            profile.updatedAt = Date.now();
        } else {
            // Create new profile
            profile = new UserProfile({
                userId: req.userId,
                height,
                weight,
                age,
                gender,
                goal,
                activityLevel,
                dailyMeals,
                dietTypes
            });
        }

        await profile.save();

        console.log('Profile saved successfully for user:', req.userId);

        res.json({
            message: 'Profile saved successfully',
            profile: {
                height: profile.height,
                weight: profile.weight,
                age: profile.age,
                gender: profile.gender,
                goal: profile.goal,
                activityLevel: profile.activityLevel,
                dailyMeals: profile.dailyMeals,
                dietTypes: profile.dietTypes,
                updatedAt: profile.updatedAt
            }
        });
    } catch (error) {
        console.error('Profile save error:', error);
        res.status(500).json({
            message: 'Server error while saving profile',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get user profile
router.get('/', verifyToken, async (req, res) => {
    try {
        const profile = await UserProfile.findOne({ userId: req.userId });

        if (!profile) {
            return res.status(404).json({
                message: 'Profile not found. Please create a profile first.'
            });
        }

        res.json({
            profile: {
                height: profile.height,
                weight: profile.weight,
                age: profile.age,
                gender: profile.gender,
                goal: profile.goal,
                activityLevel: profile.activityLevel,
                dailyMeals: profile.dailyMeals,
                dietTypes: profile.dietTypes,
                createdAt: profile.createdAt,
                updatedAt: profile.updatedAt
            }
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            message: 'Server error while fetching profile',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Save BMI data
router.post('/save-bmi', verifyToken, async (req, res) => {
    try {
        const { height, weight, bmi, bmiCategory } = req.body;

        if (!height || !weight || !bmi || !bmiCategory) {
            return res.status(400).json({
                message: 'All BMI data is required'
            });
        }

        // Find or create user profile
        let profile = await UserProfile.findOne({ userId: req.userId });

        if (profile) {
            // Update existing profile
            profile.height = height;
            profile.weight = weight;
            profile.bmi = bmi;
            profile.bmiCategory = bmiCategory;
            profile.lastBMICalculation = new Date();
            profile.updatedAt = Date.now();
        } else {
            // Create new profile with BMI data
            profile = new UserProfile({
                userId: req.userId,
                height,
                weight,
                bmi,
                bmiCategory,
                lastBMICalculation: new Date()
            });
        }

        await profile.save();

        res.json({
            message: 'BMI data saved successfully',
            bmiData: {
                height,
                weight,
                bmi,
                bmiCategory,
                lastCalculated: profile.lastBMICalculation
            }
        });
    } catch (error) {
        console.error('Save BMI error:', error);
        res.status(500).json({
            message: 'Server error while saving BMI data',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;
