const express = require('express');
const router = express.Router();
const Food = require('../models/Food');
const { body, validationResult } = require('express-validator');

// Get all food items with filters
router.get('/', async (req, res) => {
    try {
        const { category, dietTypes, search, limit = 50, page = 1 } = req.query;

        let filter = {};

        if (category) {
            filter.category = category;
        }

        if (dietTypes) {
            const dietTypesArray = Array.isArray(dietTypes) ? dietTypes : dietTypes.split(',');
            filter.dietTypes = { $in: dietTypesArray };
        }

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const foods = await Food.find(filter)
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ name: 1 });

        const totalCount = await Food.countDocuments(filter);

        res.json({
            success: true,
            count: foods.length,
            total: totalCount,
            page: parseInt(page),
            pages: Math.ceil(totalCount / limit),
            data: foods
        });

    } catch (error) {
        console.error('Get foods error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching foods',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get food by ID
router.get('/:id', async (req, res) => {
    try {
        const food = await Food.findById(req.params.id);

        if (!food) {
            return res.status(404).json({
                success: false,
                message: 'Food not found'
            });
        }

        res.json({
            success: true,
            data: food
        });

    } catch (error) {
        console.error('Get food by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Create new food item (Admin)
router.post('/', [
    body('name').notEmpty().withMessage('Food name is required'),
    body('category').isIn(['breakfast', 'lunch', 'dinner', 'snacks']).withMessage('Invalid category'),
    body('calories').isNumeric().withMessage('Calories must be a number'),
    body('protein').isNumeric().withMessage('Protein must be a number'),
    body('carbs').isNumeric().withMessage('Carbs must be a number'),
    body('fats').isNumeric().withMessage('Fats must be a number')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const foodData = req.body;
        const food = new Food(foodData);
        await food.save();

        res.status(201).json({
            success: true,
            message: 'Food item created successfully',
            data: food
        });

    } catch (error) {
        console.error('Create food error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while creating food',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Update food item
router.put('/:id', async (req, res) => {
    try {
        const food = await Food.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!food) {
            return res.status(404).json({
                success: false,
                message: 'Food not found'
            });
        }

        res.json({
            success: true,
            message: 'Food updated successfully',
            data: food
        });

    } catch (error) {
        console.error('Update food error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating food',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Delete food item (soft delete)
router.delete('/:id', async (req, res) => {
    try {
        const food = await Food.findByIdAndUpdate(
            req.params.id,
            { isActive: false },
            { new: true }
        );

        if (!food) {
            return res.status(404).json({
                success: false,
                message: 'Food not found'
            });
        }

        res.json({
            success: true,
            message: 'Food deleted successfully'
        });

    } catch (error) {
        console.error('Delete food error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting food',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get foods for diet plan generation
router.get('/plan/generate', async (req, res) => {
    try {
        const { dietTypes, dailyMeals } = req.query;

        if (!dietTypes || !dailyMeals) {
            return res.status(400).json({
                success: false,
                message: 'Diet types and daily meals are required'
            });
        }

        const dietTypesArray = Array.isArray(dietTypes) ? dietTypes : dietTypes.split(',');
        const dailyMealsArray = Array.isArray(dailyMeals) ? dailyMeals : dailyMeals.split(',');

        const planFoods = {};

        // Get foods for each meal category
        for (const meal of dailyMealsArray) {
            const foods = await Food.find({
                category: meal,
                dietTypes: { $in: dietTypesArray },
                isActive: true
            }).limit(10);

            planFoods[meal] = foods;
        }

        res.json({
            success: true,
            data: planFoods
        });

    } catch (error) {
        console.error('Plan generation error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while generating plan',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Seed database with sample foods
router.post('/seed/sample', async (req, res) => {
    try {
        const sampleFoods = [
            // BREAKFAST
            {
                name: 'Oatmeal with Berries',
                description: 'Rolled oats cooked with mixed berries (strawberries, blueberries, raspberries)',
                category: 'breakfast',
                dietTypes: ['veg', 'low-carb', 'gluten-free'],
                calories: 280,
                protein: 10,
                carbs: 45,
                fats: 5,
                fiber: 8,
                sugar: 12,
                servingSize: '1 bowl (250g)'
            },
            {
                name: 'Greek Yogurt with Honey and Nuts',
                description: 'Plain Greek yogurt drizzled with honey and topped with almonds and walnuts',
                category: 'breakfast',
                dietTypes: ['veg', 'high-protein', 'low-carb'],
                calories: 320,
                protein: 25,
                carbs: 20,
                fats: 15,
                fiber: 3,
                sugar: 15,
                servingSize: '1 cup (200g)'
            },
            {
                name: 'Egg White Omelette with Spinach',
                description: 'Fluffy egg white omelette filled with fresh spinach and mushrooms',
                category: 'breakfast',
                dietTypes: ['veg', 'high-protein', 'low-carb', 'keto'],
                calories: 180,
                protein: 20,
                carbs: 5,
                fats: 8,
                fiber: 2,
                sugar: 1,
                servingSize: '2 egg whites + vegetables'
            },
            {
                name: 'Avocado Toast',
                description: 'Whole grain toast topped with mashed avocado, cherry tomatoes, and sesame seeds',
                category: 'breakfast',
                dietTypes: ['veg', 'vegan'],
                calories: 250,
                protein: 8,
                carbs: 30,
                fats: 12,
                fiber: 9,
                sugar: 2,
                servingSize: '2 slices'
            },
            {
                name: 'Protein Smoothie',
                description: 'Banana, spinach, protein powder, almond milk, and chia seeds blended together',
                category: 'breakfast',
                dietTypes: ['veg', 'high-protein', 'low-carb'],
                calories: 300,
                protein: 25,
                carbs: 35,
                fats: 6,
                fiber: 7,
                sugar: 18,
                servingSize: '1 large glass (500ml)'
            },
            {
                name: 'Scrambled Eggs with Whole Wheat Toast',
                description: 'Two eggs scrambled with a dash of milk, served with whole wheat toast',
                category: 'breakfast',
                dietTypes: ['veg', 'high-protein'],
                calories: 350,
                protein: 22,
                carbs: 30,
                fats: 18,
                fiber: 5,
                sugar: 3,
                servingSize: '2 eggs + 2 toast slices'
            },

            // LUNCH
            {
                name: 'Grilled Chicken Salad',
                description: 'Fresh mixed greens with grilled chicken breast, cucumbers, and balsamic vinaigrette',
                category: 'lunch',
                dietTypes: ['non-veg', 'high-protein', 'low-carb'],
                calories: 350,
                protein: 35,
                carbs: 12,
                fats: 15,
                fiber: 4,
                sugar: 5,
                servingSize: 'Large bowl'
            },
            {
                name: 'Quinoa Buddha Bowl',
                description: 'Quinoa base with roasted vegetables, chickpeas, avocado, and tahini dressing',
                category: 'lunch',
                dietTypes: ['veg', 'vegan', 'high-protein', 'gluten-free'],
                calories: 420,
                protein: 18,
                carbs: 60,
                fats: 15,
                fiber: 12,
                sugar: 6,
                servingSize: '1 bowl'
            },
            {
                name: 'Turkey and Avocado Wrap',
                description: 'Whole wheat wrap filled with turkey slices, avocado, lettuce, and light mayo',
                category: 'lunch',
                dietTypes: ['non-veg', 'high-protein'],
                calories: 380,
                protein: 28,
                carbs: 45,
                fats: 12,
                fiber: 8,
                sugar: 3,
                servingSize: '1 wrap'
            },
            {
                name: 'Lentil Soup with Whole Grain Bread',
                description: 'Hearty lentil soup with carrots, celery, and onions, served with whole grain bread',
                category: 'lunch',
                dietTypes: ['veg', 'vegan', 'high-protein'],
                calories: 320,
                protein: 22,
                carbs: 50,
                fats: 5,
                fiber: 15,
                sugar: 8,
                servingSize: '1 bowl soup + 2 bread slices'
            },
            {
                name: 'Salmon with Steamed Vegetables',
                description: 'Baked salmon fillet with a side of steamed broccoli, carrots, and asparagus',
                category: 'lunch',
                dietTypes: ['non-veg', 'high-protein', 'low-carb', 'keto'],
                calories: 400,
                protein: 35,
                carbs: 15,
                fats: 22,
                fiber: 6,
                sugar: 5,
                servingSize: '150g salmon + vegetables'
            },
            {
                name: 'Chicken and Brown Rice',
                description: 'Grilled chicken breast served with brown rice and mixed vegetables',
                category: 'lunch',
                dietTypes: ['non-veg', 'high-protein'],
                calories: 450,
                protein: 40,
                carbs: 45,
                fats: 12,
                fiber: 7,
                sugar: 3,
                servingSize: '150g chicken + 1 cup rice'
            },

            // DINNER
            {
                name: 'Grilled Fish with Quinoa',
                description: 'Grilled cod or tilapia served with quinoa and lemon herb sauce',
                category: 'dinner',
                dietTypes: ['non-veg', 'high-protein', 'low-carb'],
                calories: 420,
                protein: 38,
                carbs: 35,
                fats: 15,
                fiber: 5,
                sugar: 2,
                servingSize: '150g fish + 3/4 cup quinoa'
            },
            {
                name: 'Vegetable Stir Fry with Tofu',
                description: 'Mixed vegetables and tofu stir-fried in light soy sauce, served with brown rice',
                category: 'dinner',
                dietTypes: ['veg', 'vegan', 'high-protein', 'low-carb'],
                calories: 380,
                protein: 25,
                carbs: 40,
                fats: 12,
                fiber: 8,
                sugar: 6,
                servingSize: '1 plate'
            },
            {
                name: 'Chicken Breast with Sweet Potato',
                description: 'Baked chicken breast served with roasted sweet potato and green beans',
                category: 'dinner',
                dietTypes: ['non-veg', 'high-protein', 'low-carb', 'paleo'],
                calories: 380,
                protein: 42,
                carbs: 30,
                fats: 10,
                fiber: 6,
                sugar: 8,
                servingSize: '150g chicken + 1 medium sweet potato'
            },
            {
                name: 'Whole Wheat Pasta with Marinara Sauce',
                description: 'Whole wheat pasta with homemade marinara sauce and a side salad',
                category: 'dinner',
                dietTypes: ['veg', 'vegan'],
                calories: 350,
                protein: 12,
                carbs: 60,
                fats: 6,
                fiber: 10,
                sugar: 8,
                servingSize: '1.5 cups pasta'
            },
            {
                name: 'Lean Beef Steak with Salad',
                description: 'Lean beef steak grilled to perfection with fresh garden salad',
                category: 'dinner',
                dietTypes: ['non-veg', 'high-protein', 'low-carb', 'keto', 'paleo'],
                calories: 450,
                protein: 45,
                carbs: 10,
                fats: 25,
                fiber: 3,
                sugar: 4,
                servingSize: '150g steak + salad'
            },
            {
                name: 'Chickpea Curry with Brown Rice',
                description: 'Spicy chickpea curry served with brown rice and yogurt',
                category: 'dinner',
                dietTypes: ['veg', 'vegan', 'high-protein'],
                calories: 400,
                protein: 18,
                carbs: 65,
                fats: 10,
                fiber: 15,
                sugar: 9,
                servingSize: '1 bowl curry + 3/4 cup rice'
            },

            // SNACKS
            {
                name: 'Mixed Nuts',
                description: 'A mix of almonds, walnuts, cashews, and pistachios',
                category: 'snacks',
                dietTypes: ['veg', 'vegan', 'high-protein', 'keto', 'paleo', 'gluten-free'],
                calories: 200,
                protein: 8,
                carbs: 6,
                fats: 18,
                fiber: 3,
                sugar: 2,
                servingSize: '1/4 cup (30g)'
            },
            {
                name: 'Apple with Peanut Butter',
                description: 'Fresh apple slices with natural peanut butter',
                category: 'snacks',
                dietTypes: ['veg', 'vegan'],
                calories: 180,
                protein: 6,
                carbs: 22,
                fats: 9,
                fiber: 5,
                sugar: 15,
                servingSize: '1 medium apple + 1 tbsp PB'
            },
            {
                name: 'Protein Bar',
                description: 'High protein snack bar with chocolate coating',
                category: 'snacks',
                dietTypes: ['veg', 'high-protein'],
                calories: 220,
                protein: 20,
                carbs: 22,
                fats: 7,
                fiber: 5,
                sugar: 12,
                servingSize: '1 bar (60g)'
            },
            {
                name: 'Carrot Sticks with Hummus',
                description: 'Fresh carrot sticks served with homemade hummus',
                category: 'snacks',
                dietTypes: ['veg', 'vegan', 'gluten-free'],
                calories: 150,
                protein: 5,
                carbs: 18,
                fats: 7,
                fiber: 6,
                sugar: 6,
                servingSize: '10 carrot sticks + 3 tbsp hummus'
            },
            {
                name: 'Greek Yogurt with Berries',
                description: 'Plain Greek yogurt topped with fresh berries',
                category: 'snacks',
                dietTypes: ['veg', 'high-protein', 'low-carb'],
                calories: 120,
                protein: 15,
                carbs: 12,
                fats: 2,
                fiber: 3,
                sugar: 8,
                servingSize: '3/4 cup yogurt + 1/2 cup berries'
            },
            {
                name: 'Rice Cakes with Avocado',
                description: 'Whole grain rice cakes topped with mashed avocado and everything bagel seasoning',
                category: 'snacks',
                dietTypes: ['veg', 'vegan', 'gluten-free'],
                calories: 160,
                protein: 3,
                carbs: 20,
                fats: 8,
                fiber: 5,
                sugar: 1,
                servingSize: '2 rice cakes + 1/4 avocado'
            },
            {
                name: 'Hard Boiled Eggs',
                description: 'Protein-packed hard boiled eggs with a pinch of salt and pepper',
                category: 'snacks',
                dietTypes: ['veg', 'high-protein', 'low-carb', 'keto', 'paleo'],
                calories: 140,
                protein: 12,
                carbs: 1,
                fats: 10,
                fiber: 0,
                sugar: 0,
                servingSize: '2 eggs'
            },
            {
                name: 'Dark Chocolate (85%)',
                description: 'High-quality dark chocolate with minimal sugar',
                category: 'snacks',
                dietTypes: ['veg', 'vegan', 'low-carb', 'keto', 'gluten-free'],
                calories: 170,
                protein: 3,
                carbs: 10,
                fats: 15,
                fiber: 4,
                sugar: 5,
                servingSize: '30g (3 squares)'
            }
        ];

        // Clear existing foods
        await Food.deleteMany({});

        // Insert sample foods
        await Food.insertMany(sampleFoods);

        res.json({
            success: true,
            message: 'Sample food database seeded successfully',
            count: sampleFoods.length,
            data: sampleFoods
        });

    } catch (error) {
        console.error('Seed database error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while seeding database',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get food statistics
router.get('/stats/summary', async (req, res) => {
    try {
        const stats = {
            totalFoods: await Food.countDocuments({ isActive: true }),
            byCategory: {
                breakfast: await Food.countDocuments({ category: 'breakfast', isActive: true }),
                lunch: await Food.countDocuments({ category: 'lunch', isActive: true }),
                dinner: await Food.countDocuments({ category: 'dinner', isActive: true }),
                snacks: await Food.countDocuments({ category: 'snacks', isActive: true })
            },
            byDietType: {
                veg: await Food.countDocuments({ dietTypes: 'veg', isActive: true }),
                'non-veg': await Food.countDocuments({ dietTypes: 'non-veg', isActive: true }),
                'low-carb': await Food.countDocuments({ dietTypes: 'low-carb', isActive: true }),
                'high-protein': await Food.countDocuments({ dietTypes: 'high-protein', isActive: true }),
                vegan: await Food.countDocuments({ dietTypes: 'vegan', isActive: true }),
                keto: await Food.countDocuments({ dietTypes: 'keto', isActive: true }),
                paleo: await Food.countDocuments({ dietTypes: 'paleo', isActive: true }),
                'gluten-free': await Food.countDocuments({ dietTypes: 'gluten-free', isActive: true })
            }
        };

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching statistics'
        });
    }
});

module.exports = router;