const mongoose = require('mongoose');
const Food = require('./models/Food');

mongoose.connect('mongodb://localhost:27017/dietTrack', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const indianFoods = [
    // ========== VEGETARIAN (Lacto-ovo) ==========
    {
        name: "Masala Omelette (2 eggs)",
        description: "Spiced Indian style omelette with onions, tomatoes, and green chilies",
        category: "breakfast",
        dietTypes: ["veg", "high-protein"],
        calories: 280,
        protein: 18,
        carbs: 2,
        fats: 22,
        servingSize: "2 eggs",
        isActive: true
    },
    {
        name: "Paneer Tikka Masala",
        description: "Paneer",
        category: "dinner",
        dietTypes: ["veg", "high-protein"],
        calories: 420,
        protein: 32,
        carbs: 18,
        fats: 28,
        servingSize: "Paneer and Roti",
        isActive: true
    },
    {
        name: "Poha with peanuts",
        description: "Flattened rice cooked with turmeric, peanuts, and spices",
        category: "breakfast",
        dietTypes: ["veg", "gluten-free"],
        calories: 320,
        protein: 8,
        carbs: 45,
        fats: 12,
        servingSize: "1.5 cups",
        isActive: true
    },
    {
        name: "Moong Dal Chilla (2)",
        description: "Savory lentil pancakes made from split yellow lentils",
        category: "breakfast",
        dietTypes: ["veg", "high-protein", "gluten-free"],
        calories: 300,
        protein: 15,
        carbs: 35,
        fats: 10,
        servingSize: "2 chillas",
        isActive: true
    },
    {
        name: "Vegetable Upma",
        description: "Semolina cooked with vegetables and tempered with mustard seeds",
        category: "breakfast",
        dietTypes: ["veg"],
        calories: 280,
        protein: 7,
        carbs: 40,
        fats: 10,
        servingSize: "1.5 cups",
        isActive: true
    },
    {
        name: "Rajma Chawal",
        description: "Kidney beans curry served with steamed rice",
        category: "lunch",
        dietTypes: ["veg", "vegan", "gluten-free"],
        calories: 500,
        protein: 18,
        carbs: 75,
        fats: 15,
        servingSize: "1 cup curry + 1 cup rice",
        isActive: true
    },
    {
        name: "Palak Paneer + 2 Roti",
        description: "Spinach curry with cottage cheese served with whole wheat flatbread",
        category: "lunch",
        dietTypes: ["veg", "high-protein"],
        calories: 480,
        protein: 22,
        carbs: 45,
        fats: 25,
        servingSize: "1.5 cups curry + 2 roti",
        isActive: true
    },
    {
        name: "Mix Veg Sabzi + Dal + Rice",
        description: "Mixed vegetables curry with lentil soup and rice",
        category: "lunch",
        dietTypes: ["veg", "vegan", "gluten-free"],
        calories: 450,
        protein: 16,
        carbs: 70,
        fats: 12,
        servingSize: "1 cup each",
        isActive: true
    },
    {
        name: "Dal Tadka + 2 Roti + Salad",
        description: "Tempered lentil soup with flatbread and cucumber salad",
        category: "dinner",
        dietTypes: ["veg", "vegan"],
        calories: 400,
        protein: 18,
        carbs: 55,
        fats: 12,
        servingSize: "1 cup dal + 2 roti",
        isActive: true
    },
    {
        name: "Sprouts Chaat (1 cup)",
        description: "Sprouted legumes mixed with onions, tomatoes, and chaat masala",
        category: "snacks",
        dietTypes: ["veg", "vegan", "high-protein", "gluten-free"],
        calories: 180,
        protein: 12,
        carbs: 25,
        fats: 4,
        servingSize: "1 cup",
        isActive: true
    },

    // ========== NON-VEGETARIAN ==========
    {
        name: "Egg Bhurji with 2 Roti",
        description: "Indian style scrambled eggs with spices, served with flatbread",
        category: "breakfast",
        dietTypes: ["non-veg", "high-protein"],
        calories: 380,
        protein: 24,
        carbs: 30,
        fats: 18,
        servingSize: "3 eggs +  2 roti",
        isActive: true
    },
    {
        name: "Chicken Curry + Rice",
        description: "Spicy chicken curry served with steamed rice",
        category: "lunch",
        dietTypes: ["non-veg", "high-protein", "gluten-free"],
        calories: 520,
        protein: 35,
        carbs: 50,
        fats: 22,
        servingSize: "1.5 cups curry + 1 cup rice",
        isActive: true
    },
    {
        name: "Fish Curry + 2 Roti",
        description: "Fish cooked in spicy gravy with whole wheat flatbread",
        category: "lunch",
        dietTypes: ["non-veg", "high-protein"],
        calories: 480,
        protein: 30,
        carbs: 40,
        fats: 20,
        servingSize: "2 pieces fish + 2 roti",
        isActive: true
    },
    {
        name: "Tandoori Chicken (2 pieces)",
        description: "Chicken marinated in yogurt and spices, cooked in tandoor",
        category: "snacks",
        dietTypes: ["non-veg", "high-protein", "low-carb", "paleo"],
        calories: 200,
        protein: 28,
        carbs: 3,
        fats: 9,
        servingSize: "2 pieces",
        isActive: true
    },

    // ========== LOW-CARB ==========
    {
        name: "Paneer Bhurji (no onions/tomatoes)",
        description: "Scrambled cottage cheese with Indian spices",
        category: "breakfast",
        dietTypes: ["veg", "low-carb", "high-protein"],
        calories: 300,
        protein: 20,
        carbs: 6,
        fats: 24,
        servingSize: "150g paneer",
        isActive: true
    },
    {
        name: "Chicken Salad with avocado",
        description: "Grilled chicken with cabbage, lettuce, cucumber, and avocado",
        category: "lunch",
        dietTypes: ["non-veg", "low-carb", "high-protein", "paleo"],
        calories: 350,
        protein: 30,
        carbs: 10,
        fats: 22,
        servingSize: "Large bowl",
        isActive: true
    },
    {
        name: "Paneer Tikka (grilled, 200g)",
        description: "Cottage cheese cubes marinated and grilled",
        category: "lunch",
        dietTypes: ["veg", "low-carb", "high-protein"],
        calories: 380,
        protein: 28,
        carbs: 8,
        fats: 28,
        servingSize: "200g",
        isActive: true
    },
    {
        name: "Cheese cubes (30g)",
        description: "Cheddar or paneer cheese cubes",
        category: "snacks",
        dietTypes: ["veg", "low-carb"],
        calories: 120,
        protein: 7,
        carbs: 1,
        fats: 10,
        servingSize: "30g",
        isActive: true
    },

    // ========== HIGH-PROTEIN ==========
    {
        name: "Sprouts & Paneer Salad",
        description: "Mixed sprouts with cottage cheese cubes and vegetables",
        category: "breakfast",
        dietTypes: ["veg", "high-protein"],
        calories: 320,
        protein: 28,
        carbs: 20,
        fats: 15,
        servingSize: "Large bowl",
        isActive: true
    },
    {
        name: "Protein Shake (whey + almond milk)",
        description: "Whey protein powder mixed with almond milk",
        category: "snacks",
        dietTypes: ["veg", "high-protein", "low-carb"],
        calories: 180,
        protein: 25,
        carbs: 8,
        fats: 5,
        servingSize: "1 scoop whey + 250ml milk",
        isActive: true
    },

    // ========== VEGAN ==========
    {
        name: "Oats Porridge (almond milk, nuts, fruits)",
        description: "Oats cooked in almond milk with nuts and fresh fruits",
        category: "breakfast",
        dietTypes: ["veg", "vegan", "gluten-free"],
        calories: 300,
        protein: 10,
        carbs: 45,
        fats: 12,
        servingSize: "1.5 cups",
        isActive: true
    },
    {
        name: "Chana Masala + Brown Rice",
        description: "Chickpea curry served with brown rice",
        category: "lunch",
        dietTypes: ["veg", "vegan", "gluten-free"],
        calories: 420,
        protein: 15,
        carbs: 70,
        fats: 10,
        servingSize: "1.5 cups curry + 1 cup rice",
        isActive: true
    },
    {
        name: "Hummus with carrot sticks",
        description: "Chickpea dip with fresh carrot sticks",
        category: "snacks",
        dietTypes: ["veg", "vegan", "gluten-free"],
        calories: 180,
        protein: 5,
        carbs: 15,
        fats: 12,
        servingSize: "3 tbsp hummus + carrot sticks",
        isActive: true
    },

    // ========== PALEO ==========
    {
        name: "Sweet Potato & Egg Hash",
        description: "Diced sweet potato scrambled with eggs and spices",
        category: "breakfast",
        dietTypes: ["non-veg", "paleo", "gluten-free"],
        calories: 320,
        protein: 18,
        carbs: 25,
        fats: 18,
        servingSize: "1 medium sweet potato + 2 eggs",
        isActive: true
    },
    {
        name: "Grilled Chicken Salad (nuts, olive oil)",
        description: "Grilled chicken with mixed greens, nuts, and olive oil dressing",
        category: "lunch",
        dietTypes: ["non-veg", "paleo", "low-carb", "high-protein"],
        calories: 400,
        protein: 35,
        carbs: 10,
        fats: 25,
        servingSize: "Large bowl",
        isActive: true
    },
    {
        name: "Almonds (30g)",
        description: "Raw almonds",
        category: "snacks",
        dietTypes: ["veg", "paleo", "vegan", "gluten-free"],
        calories: 180,
        protein: 6,
        carbs: 6,
        fats: 16,
        servingSize: "30g (about 23 almonds)",
        isActive: true
    },

    // ========== GLUTEN-FREE ==========
    {
        name: "Rice Poha (1.5 cups)",
        description: "Flattened rice cooked with peanuts and spices",
        category: "breakfast",
        dietTypes: ["veg", "gluten-free"],
        calories: 300,
        protein: 8,
        carbs: 50,
        fats: 10,
        servingSize: "1.5 cups",
        isActive: true
    },
    {
        name: "Idli (4) with sambar & chutney",
        description: "Steamed rice cakes with lentil soup and coconut chutney",
        category: "breakfast",
        dietTypes: ["veg", "vegan", "gluten-free"],
        calories: 350,
        protein: 12,
        carbs: 60,
        fats: 8,
        servingSize: "4 idlis",
        isActive: true
    },
    {
        name: "Makhana (1 cup roasted)",
        description: "Roasted fox nuts seasoned with spices",
        category: "snacks",
        dietTypes: ["veg", "vegan", "gluten-free", "paleo"],
        calories: 120,
        protein: 4,
        carbs: 20,
        fats: 3,
        servingSize: "1 cup",
        isActive: true
    }
];

async function seedIndianFoods() {
    try {
        console.log('🌱 Seeding Indian food database...');

        // Clear existing foods
        await Food.deleteMany({});
        console.log('🗑️ Cleared existing foods');

        // Insert Indian foods
        const result = await Food.insertMany(indianFoods);
        console.log(`✅ Added ${result.length} Indian food items to database!`);

        // Show statistics
        console.log('\n📊 Food Statistics:');

        const categories = ['breakfast', 'lunch', 'dinner', 'snacks'];
        for (const category of categories) {
            const count = indianFoods.filter(f => f.category === category).length;
            console.log(`   ${category.charAt(0).toUpperCase() + category.slice(1)}: ${count} items`);
        }

        console.log('\n🍽️ Diet Types Distribution:');
        const dietTypes = {
            'veg': indianFoods.filter(f => f.dietTypes.includes('veg')).length,
            'non-veg': indianFoods.filter(f => f.dietTypes.includes('non-veg')).length,
            'vegan': indianFoods.filter(f => f.dietTypes.includes('vegan')).length,
            'high-protein': indianFoods.filter(f => f.dietTypes.includes('high-protein')).length,
            'low-carb': indianFoods.filter(f => f.dietTypes.includes('low-carb')).length,
            'paleo': indianFoods.filter(f => f.dietTypes.includes('paleo')).length,
            'gluten-free': indianFoods.filter(f => f.dietTypes.includes('gluten-free')).length
        };

        for (const [diet, count] of Object.entries(dietTypes)) {
            console.log(`   ${diet}: ${count} items`);
        }

        console.log('\n🎉 Indian food database seeded successfully!');
        console.log('👉 Now test: http://localhost:3000/api/food');
        console.log('👉 Refresh your diet plan page to see Indian food options!');

        mongoose.disconnect();

    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
}

// Run when connected
mongoose.connection.once('open', seedIndianFoods);
