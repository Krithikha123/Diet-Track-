const express = require('express');
const router = express.Router();
const MealLog = require('../models/MealLog');
const WorkoutLog = require('../models/WorkoutLog');
const { verifyToken } = require('./auth'); // adjust path as needed

// ------------------- Meal Logs -------------------
router.post('/meal', verifyToken, async (req, res) => {
    try {
        const { mealType, foodItems, totalCalories, totalProtein, totalCarbs, totalFats, date } = req.body;
        const mealLog = new MealLog({
            userId: req.userId,
            date: date || Date.now(),
            mealType,
            foodItems,
            totalCalories,
            totalProtein,
            totalCarbs,
            totalFats
        });
        await mealLog.save();
        res.json({ success: true, message: 'Meal logged', data: mealLog });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.get('/meal', verifyToken, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const query = { userId: req.userId };
        if (startDate && endDate) {
            query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }
        const logs = await MealLog.find(query).sort({ date: -1 });
        res.json({ success: true, data: logs });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ------------------- Workout Logs -------------------
router.post('/workout', verifyToken, async (req, res) => {
    try {
        const { workoutType, duration, caloriesBurned, exercises, date } = req.body;
        const workoutLog = new WorkoutLog({
            userId: req.userId,
            date: date || Date.now(),
            workoutType,
            duration,
            caloriesBurned,
            exercises
        });
        await workoutLog.save();
        res.json({ success: true, message: 'Workout logged', data: workoutLog });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.get('/workout', verifyToken, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const query = { userId: req.userId };
        if (startDate && endDate) {
            query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }
        const logs = await WorkoutLog.find(query).sort({ date: -1 });
        res.json({ success: true, data: logs });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ------------------- Aggregated Nutrition for Graphs -------------------
router.get('/nutrition/summary', verifyToken, async (req, res) => {
    try {
        const { days = 7 } = req.query; // last N days
        const endDate = new Date();
        endDate.setHours(23, 59, 59, 999); // End of today

        const startDate = new Date();
        startDate.setHours(0, 0, 0, 0); // Start of today
        startDate.setDate(startDate.getDate() - (parseInt(days) - 1)); // Include today in the N days

        const logs = await MealLog.find({
            userId: req.userId,
            date: { $gte: startDate, $lte: endDate }
        }).sort({ date: 1 });

        const dailyTotals = {};
        logs.forEach(log => {
            const dateStr = log.date.toISOString().split('T')[0];
            if (!dailyTotals[dateStr]) {
                dailyTotals[dateStr] = { calories: 0, protein: 0, carbs: 0, fats: 0 };
            }
            dailyTotals[dateStr].calories += log.totalCalories || 0;
            dailyTotals[dateStr].protein += log.totalProtein || 0;
            dailyTotals[dateStr].carbs += log.totalCarbs || 0;
            dailyTotals[dateStr].fats += log.totalFats || 0;
        });

        const result = Object.keys(dailyTotals).map(date => ({
            date,
            ...dailyTotals[date]
        }));

        res.json({ success: true, data: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ------------------- NEW: Aggregated Workout Stats for Graphs -------------------
router.get('/workout/stats', verifyToken, async (req, res) => {
    try {
        const { days = 14 } = req.query; // last N days (default 14)
        const endDate = new Date();
        endDate.setHours(23, 59, 59, 999);

        const startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        startDate.setDate(startDate.getDate() - (parseInt(days) - 1));

        const logs = await WorkoutLog.find({
            userId: req.userId,
            date: { $gte: startDate, $lte: endDate }
        }).sort({ date: 1 });

        // Daily totals for line graphs
        const dailyTotals = {};
        const workoutTypes = {};

        logs.forEach(log => {
            const dateStr = log.date.toISOString().split('T')[0];

            if (!dailyTotals[dateStr]) {
                dailyTotals[dateStr] = {
                    date: dateStr,
                    totalDuration: 0,
                    totalCalories: 0,
                    workouts: []
                };
            }

            dailyTotals[dateStr].totalDuration += log.duration || 0;
            dailyTotals[dateStr].totalCalories += log.caloriesBurned || 0;
            dailyTotals[dateStr].workouts.push(log.workoutType);

            // Count workout types
            workoutTypes[log.workoutType] = (workoutTypes[log.workoutType] || 0) + 1;
        });

        // Calculate weekly averages
        const weeklyAverages = calculateWeeklyAverages(logs);

        // Calculate exercise frequency
        const exerciseFrequency = {};
        logs.forEach(log => {
            if (log.exercises && Array.isArray(log.exercises) && log.exercises.length) {
                log.exercises.forEach(ex => {
                    const exName = ex.name || 'Unknown';
                    exerciseFrequency[exName] = (exerciseFrequency[exName] || 0) + 1;
                });
            }
        });

        res.json({
            success: true,
            data: {
                daily: Object.values(dailyTotals),
                workoutTypes,
                weeklyAverages,
                exerciseFrequency,
                totalWorkouts: logs.length,
                totalDuration: logs.reduce((sum, log) => sum + (log.duration || 0), 0),
                totalCalories: logs.reduce((sum, log) => sum + (log.caloriesBurned || 0), 0)
            }
        });

    } catch (error) {
        console.error('Workout stats error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Helper function to calculate weekly averages
function calculateWeeklyAverages(logs) {
    if (!logs || logs.length === 0) return [];

    const weeklyData = {};

    logs.forEach(log => {
        const date = new Date(log.date);
        // Get week number (relative to start of year)
        const startOfYear = new Date(date.getFullYear(), 0, 1);
        const weekNum = Math.ceil((((date - startOfYear) / 86400000) + startOfYear.getDay() + 1) / 7);
        const yearWeek = `${date.getFullYear()}-W${weekNum}`;

        if (!weeklyData[yearWeek]) {
            weeklyData[yearWeek] = {
                week: weekNum,
                year: date.getFullYear(),
                totalDuration: 0,
                totalCalories: 0,
                count: 0
            };
        }

        weeklyData[yearWeek].totalDuration += log.duration || 0;
        weeklyData[yearWeek].totalCalories += log.caloriesBurned || 0;
        weeklyData[yearWeek].count += 1;
    });

    // Calculate averages
    const result = Object.values(weeklyData).map(week => ({
        week: `Week ${week.week}`,
        avgDuration: Math.round(week.totalDuration / week.count),
        avgCalories: Math.round(week.totalCalories / week.count),
        totalWorkouts: week.count
    }));

    return result;
}

// ------------------- NEW: Workout Summary for a Specific Date -------------------
router.get('/workout/daily/:date', verifyToken, async (req, res) => {
    try {
        const dateParam = req.params.date;
        const startDate = new Date(dateParam);
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(dateParam);
        endDate.setHours(23, 59, 59, 999);

        const logs = await WorkoutLog.find({
            userId: req.userId,
            date: { $gte: startDate, $lte: endDate }
        }).sort({ date: 1 });

        res.json({
            success: true,
            data: logs
        });

    } catch (error) {
        console.error('Daily workout error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ------------------- NEW: Combined Dashboard Summary -------------------
router.get('/dashboard/summary', verifyToken, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);

        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);

        // Get today's meal logs
        const todayMeals = await MealLog.find({
            userId: req.userId,
            date: { $gte: today }
        });

        // Get today's workout logs
        const todayWorkouts = await WorkoutLog.find({
            userId: req.userId,
            date: { $gte: today }
        });

        // Get weekly nutrition totals
        const weeklyMeals = await MealLog.find({
            userId: req.userId,
            date: { $gte: weekAgo }
        });

        // Get weekly workout totals
        const weeklyWorkouts = await WorkoutLog.find({
            userId: req.userId,
            date: { $gte: weekAgo }
        });

        // Calculate weekly nutrition averages
        const weeklyNutrition = weeklyMeals.reduce((acc, meal) => {
            acc.calories += meal.totalCalories || 0;
            acc.protein += meal.totalProtein || 0;
            acc.carbs += meal.totalCarbs || 0;
            acc.fats += meal.totalFats || 0;
            return acc;
        }, { calories: 0, protein: 0, carbs: 0, fats: 0 });

        const daysWithMeals = new Set(weeklyMeals.map(m =>
            m.date.toISOString().split('T')[0]
        )).size || 1;

        // Calculate weekly workout stats
        const weeklyWorkoutStats = weeklyWorkouts.reduce((acc, workout) => {
            acc.duration += workout.duration || 0;
            acc.caloriesBurned += workout.caloriesBurned || 0;
            return acc;
        }, { duration: 0, caloriesBurned: 0 });

        res.json({
            success: true,
            data: {
                today: {
                    meals: todayMeals.length,
                    calories: todayMeals.reduce((sum, m) => sum + (m.totalCalories || 0), 0),
                    workouts: todayWorkouts.length,
                    workoutDuration: todayWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0)
                },
                weekly: {
                    avgCalories: Math.round(weeklyNutrition.calories / daysWithMeals),
                    avgProtein: Math.round(weeklyNutrition.protein / daysWithMeals),
                    avgCarbs: Math.round(weeklyNutrition.carbs / daysWithMeals),
                    avgFats: Math.round(weeklyNutrition.fats / daysWithMeals),
                    totalWorkouts: weeklyWorkouts.length,
                    avgWorkoutDuration: weeklyWorkouts.length ?
                        Math.round(weeklyWorkoutStats.duration / weeklyWorkouts.length) : 0,
                    totalCaloriesBurned: weeklyWorkoutStats.caloriesBurned
                }
            }
        });

    } catch (error) {
        console.error('Dashboard summary error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;