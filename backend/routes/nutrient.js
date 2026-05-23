const express = require('express');
const router = express.Router();
const MealLog = require('../models/MealLog');
const UserProfile = require('../models/UserProfile');
const { verifyToken } = require('./auth');

const PYTHON_SERVICE_URL = 'http://localhost:5000';

// @route   POST api/nutrient/analyze
// @desc    Analyze nutrient intake using Python ML service (with fetch fallback)
// @access  Private
router.post('/analyze', verifyToken, async (req, res) => {
    try {
        const { startDate, endDate } = req.body;
        const userId = req.userId;

        // Validate dates
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Please provide both startDate and endDate'
            });
        }

        // 1. Fetch User Profile
        const userProfile = await UserProfile.findOne({ userId });
        if (!userProfile) {
            return res.status(404).json({
                success: false,
                message: 'User profile not found. Please complete your profile first.'
            });
        }

        // 2. Fetch Meal Logs for the date range
        const query = {
            userId,
            date: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        };

        const mealLogs = await MealLog.find(query).lean();
        console.log(`Found ${mealLogs.length} meal logs for user ${userId}`);

        // 3. Try Python ML Service first
        try {
            console.log('Attempting to call Python ML Service at:', `${PYTHON_SERVICE_URL}/analyze/nutrients`);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const pythonResponse = await fetch(`${PYTHON_SERVICE_URL}/analyze/nutrients`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    mealLogs,
                    userProfile: userProfile.toObject()
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (pythonResponse.ok) {
                const pythonData = await pythonResponse.json();
                if (pythonData && pythonData.success && pythonData.data) {
                    console.log('✅ Python service analysis successful');

                    // Normalize snake_case keys from Python to camelCase for Frontend
                    const normalizedAnalysis = {};
                    const rawAnalysis = pythonData.data.analysis || {};

                    Object.keys(rawAnalysis).forEach(key => {
                        const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
                        normalizedAnalysis[camelKey] = rawAnalysis[key];
                    });

                    // Normalize recommendation fields
                    const normalizedRecommendations = (pythonData.data.recommendations || []).map(rec => ({
                        nutrient: rec.nutrient.replace(/_([a-z])/g, (g) => g[1].toUpperCase()), // Normalize to camelCase
                        deficiency: rec.deficiency || rec.severity, // Map severity to deficiency
                        foods: rec.foods || rec.recommended_foods || [], // Map recommended_foods to foods
                        mealSuggestions: rec.mealSuggestions || []
                    }));

                    return res.json({
                        success: true,
                        data: {
                            analysis: normalizedAnalysis,
                            recommendations: normalizedRecommendations,
                            overallScore: pythonData.data.overallScore || 0
                        },
                        source: 'python-ml'
                    });
                }
            }

            console.warn('⚠️ Python service returned unexpected response, falling back to local analysis');

        } catch (pythonError) {
            if (pythonError.name === 'AbortError') {
                console.warn('⚠️ Python service timeout, using local analysis');
            } else {
                console.warn('⚠️ Python service error:', pythonError.message);
            }
        }

        // 4. Fallback to Local Analysis
        console.log('📊 Performing local nutrient analysis...');
        const localAnalysis = performLocalAnalysis(mealLogs, userProfile);

        res.json({
            success: true,
            data: localAnalysis,
            source: 'local-fallback'
        });

    } catch (error) {
        console.error('❌ Nutrient analysis error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error during nutrient analysis',
            error: error.message
        });
    }
});

// @route   GET api/nutrient/latest
// @desc    Get latest analysis (Placeholder)
// @access  Private
router.get('/latest', verifyToken, async (req, res) => {
    res.json({
        success: false,
        message: 'No previous analysis found'
    });
});

// ========== LOCAL ANALYSIS FALLBACK FUNCTION ==========

function performLocalAnalysis(mealLogs, userProfile) {
    // Default nutrient requirements
    const requirements = {
        protein: { min: 50, max: 200, unit: 'g' },
        iron: { min: 8, max: 45, unit: 'mg' },
        calcium: { min: 1000, max: 2500, unit: 'mg' },
        vitaminB12: { min: 2.4, max: 100, unit: 'mcg' },
        fiber: { min: 25, max: 100, unit: 'g' }
    };

    // Food database for recommendations
    const foodDatabase = {
        protein: [
            { name: 'Chicken Breast', amount: '100g', nutrientContent: 31 },
            { name: 'Eggs', amount: '2 large', nutrientContent: 12 },
            { name: 'Greek Yogurt', amount: '1 cup', nutrientContent: 20 },
            { name: 'Lentils', amount: '1 cup cooked', nutrientContent: 18 },
            { name: 'Salmon', amount: '100g', nutrientContent: 22 }
        ],
        iron: [
            { name: 'Spinach', amount: '1 cup cooked', nutrientContent: 6.4 },
            { name: 'Lentils', amount: '1 cup cooked', nutrientContent: 6.6 },
            { name: 'Pumpkin Seeds', amount: '30g', nutrientContent: 4.2 },
            { name: 'Red Meat', amount: '100g', nutrientContent: 2.7 },
            { name: 'Dark Chocolate', amount: '30g', nutrientContent: 3.4 }
        ],
        calcium: [
            { name: 'Milk', amount: '1 cup', nutrientContent: 300 },
            { name: 'Yogurt', amount: '1 cup', nutrientContent: 300 },
            { name: 'Cheese', amount: '50g', nutrientContent: 400 },
            { name: 'Sardines', amount: '100g', nutrientContent: 382 },
            { name: 'Almonds', amount: '30g', nutrientContent: 75 }
        ],
        vitaminB12: [
            { name: 'Clams', amount: '100g', nutrientContent: 98.9 },
            { name: 'Liver', amount: '100g', nutrientContent: 83 },
            { name: 'Fish', amount: '100g', nutrientContent: 3.5 },
            { name: 'Eggs', amount: '2 large', nutrientContent: 1.2 },
            { name: 'Fortified Cereals', amount: '1 serving', nutrientContent: 6 }
        ],
        fiber: [
            { name: 'Lentils', amount: '1 cup cooked', nutrientContent: 15.6 },
            { name: 'Black Beans', amount: '1 cup cooked', nutrientContent: 15 },
            { name: 'Chia Seeds', amount: '30g', nutrientContent: 10 },
            { name: 'Oats', amount: '1 cup cooked', nutrientContent: 4 },
            { name: 'Broccoli', amount: '1 cup cooked', nutrientContent: 5 }
        ]
    };

    // Meal suggestions
    const mealSuggestions = {
        protein: [
            "Start your day with a protein-rich omelette",
            "Add grilled chicken to your lunch salad",
            "Have Greek yogurt as an afternoon snack"
        ],
        iron: [
            "Combine iron-rich foods with vitamin C for better absorption",
            "Add spinach to your morning smoothie",
            "Snack on pumpkin seeds throughout the day"
        ],
        calcium: [
            "Start your day with fortified milk or yogurt",
            "Add cheese to your sandwiches and salads",
            "Include leafy greens like kale in your meals"
        ],
        vitaminB12: [
            "Include fish or seafood in your weekly meals",
            "Add eggs to your breakfast",
            "Consider B12 supplements if vegetarian"
        ],
        fiber: [
            "Start your day with oatmeal",
            "Add beans or lentils to your meals",
            "Choose whole grains over refined"
        ]
    };

    // Calculate totals from meal logs
    const totals = {};
    Object.keys(requirements).forEach(nutrient => totals[nutrient] = 0);

    mealLogs.forEach(log => {
        if (log.foodItems && Array.isArray(log.foodItems)) {
            log.foodItems.forEach(item => {
                Object.keys(requirements).forEach(nutrient => {
                    totals[nutrient] += item[nutrient] || 0;
                });
            });
        }
    });

    // Adjust requirements based on user profile
    const adjustedReqs = JSON.parse(JSON.stringify(requirements));
    if (userProfile.gender === 'female') {
        adjustedReqs.iron.min *= 1.5;
    }
    if (userProfile.age > 50) {
        adjustedReqs.calcium.min *= 1.2;
    }

    // Calculate days analyzed
    const daysAnalyzed = mealLogs.length > 0 ?
        [...new Set(mealLogs.map(l => new Date(l.date).toDateString()))].length : 7;

    // Analyze each nutrient
    const analysis = {};

    Object.keys(adjustedReqs).forEach(nutrient => {
        const intake = totals[nutrient] || 0;
        const recommendedPerDay = adjustedReqs[nutrient].min;
        const recommended = recommendedPerDay * daysAnalyzed;
        const percentage = recommended > 0 ? (intake / recommended) * 100 : 0;

        let deficient = false;
        let severity = 'good';

        if (percentage < 50) {
            deficient = true;
            severity = 'critical';
        } else if (percentage < 70) {
            deficient = true;
            severity = 'moderate';
        } else if (percentage < 90) {
            deficient = true;
            severity = 'mild';
        }

        analysis[nutrient] = {
            intake: Math.round(intake * 10) / 10,
            recommended: Math.round(recommended * 10) / 10,
            recommendedPerDay: recommendedPerDay,
            percentage: Math.round(percentage * 10) / 10,
            deficient,
            severity,
            unit: requirements[nutrient].unit,
            excess: percentage > 120
        };
    });

    // Generate recommendations
    const recommendations = [];

    Object.keys(analysis).forEach(nutrient => {
        if (analysis[nutrient].deficient) {
            const severity = analysis[nutrient].severity;
            const foods = foodDatabase[nutrient] || [];

            // Sort foods by nutrient content (highest first)
            const sortedFoods = [...foods].sort((a, b) => b.nutrientContent - a.nutrientContent).slice(0, 4);

            // Get meal suggestions for this nutrient
            const suggestions = mealSuggestions[nutrient] || [
                `Add more ${nutrient}-rich foods to your diet`,
                `Consider foods like ${sortedFoods.map(f => f.name).join(', ')}`,
                `Track your ${nutrient} intake more carefully`
            ];

            recommendations.push({
                nutrient,
                deficiency: severity,
                foods: sortedFoods,
                mealSuggestions: suggestions.slice(0, 3)
            });
        }
    });

    // Calculate overall score
    const scores = Object.values(analysis).map(n => Math.min(n.percentage, 100));
    const overallScore = scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0;

    return {
        analysis,
        recommendations,
        overallScore,
        daysAnalyzed: daysAnalyzed || 7
    };
}

module.exports = router;