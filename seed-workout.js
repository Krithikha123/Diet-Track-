const mongoose = require('mongoose');
const Exercise = require('./models/Exercise');

mongoose.connect('mongodb://localhost:27017/dietTrack', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const workoutExercises = [
    // ===== WARMUP EXERCISES =====
    {
        name: "Jumping Jacks",
        category: "warmup",
        muscleGroups: ["full_body"],
        difficulty: "beginner",
        equipment: ["none"],
        caloriesPerMin: 8,
        description: "Full body cardio warmup",
        instructions: "Stand with feet together, jump while spreading legs and raising arms overhead, then return to start.",
        commonMistakes: ["Not landing softly", "Incomplete arm extension"],
        isDefault: true
    },
    {
        name: "Arm Circles",
        category: "warmup",
        muscleGroups: ["shoulders"],
        difficulty: "beginner",
        equipment: ["none"],
        caloriesPerMin: 2,
        description: "Shoulder mobility exercise",
        instructions: "Extend arms to sides and make small circles, gradually increasing size.",
        commonMistakes: ["Circles too fast", "Not controlled"],
        isDefault: true
    },
    {
        name: "Leg Swings",
        category: "warmup",
        muscleGroups: ["hamstrings", "quadriceps"],
        difficulty: "beginner",
        equipment: ["none"],
        caloriesPerMin: 3,
        description: "Dynamic leg stretch",
        instructions: "Hold onto support and swing one leg forward and back, then side to side.",
        commonMistakes: ["Using momentum", "Overextending"],
        isDefault: true
    },
    {
        name: "Cat-Cow Stretch",
        category: "warmup",
        muscleGroups: ["back", "core"],
        difficulty: "beginner",
        equipment: ["yoga_mat"],
        caloriesPerMin: 2,
        description: "Spinal mobility",
        instructions: "On hands and knees, alternate between arching back upwards and dipping it downwards.",
        commonMistakes: ["Rushing movement", "Not breathing"],
        isDefault: true
    },
    {
        name: "High Knees (Warmup)",
        category: "warmup",
        muscleGroups: ["quadriceps", "core"],
        difficulty: "beginner",
        equipment: ["none"],
        caloriesPerMin: 9,
        description: "Dynamic cardio warmup",
        instructions: "Run in place, driving knees up toward chest as high as possible.",
        commonMistakes: ["Leaning back", "Not lifting knees"],
        isDefault: true
    },
    {
        name: "Butt Kicks",
        category: "warmup",
        muscleGroups: ["hamstrings", "calves"],
        difficulty: "beginner",
        equipment: ["none"],
        caloriesPerMin: 7,
        description: "Hamstring activation",
        instructions: "Jog in place while kicking heels up toward glutes.",
        commonMistakes: ["Not bringing heels high enough"],
        isDefault: true
    },
    {
        name: "Torso Twists",
        category: "warmup",
        muscleGroups: ["core", "back"],
        difficulty: "beginner",
        equipment: ["none"],
        caloriesPerMin: 3,
        description: "Spinal rotation warmup",
        instructions: "Stand with feet shoulder-width, rotate upper body side to side, keeping hips stable.",
        commonMistakes: ["Moving hips", "Too fast"],
        isDefault: true
    },
    {
        name: "Ankle Rotations",
        category: "warmup",
        muscleGroups: ["calves"],
        difficulty: "beginner",
        equipment: ["none"],
        caloriesPerMin: 1,
        description: "Ankle mobility",
        instructions: "Lift one foot and rotate ankle clockwise then counter-clockwise; repeat with other foot.",
        commonMistakes: ["Not full range"],
        isDefault: true
    },

    // ===== STRENGTH EXERCISES =====
    {
        name: "Push-ups",
        category: "strength",
        muscleGroups: ["chest", "shoulders", "triceps"],
        difficulty: "beginner",
        equipment: ["none"],
        caloriesPerMin: 8,
        description: "Classic upper body strength exercise",
        instructions: "Start in plank position, lower chest to floor, push back up.",
        commonMistakes: ["Sagging hips", "Flaring elbows"],
        safetyTips: ["Keep core engaged", "Lower fully but don't touch floor"],
        isDefault: true
    },
    {
        name: "Bodyweight Squats",
        category: "strength",
        muscleGroups: ["quadriceps", "hamstrings", "glutes"],
        difficulty: "beginner",
        equipment: ["none"],
        caloriesPerMin: 6,
        description: "Fundamental lower body exercise",
        instructions: "Stand with feet shoulder-width, lower hips as if sitting in a chair, return to standing.",
        commonMistakes: ["Knees caving in", "Not going low enough"],
        safetyTips: ["Keep back straight", "Knees should track over toes"],
        isDefault: true
    },
    {
        name: "Plank",
        category: "strength",
        muscleGroups: ["abs", "core"],
        difficulty: "beginner",
        equipment: ["none"],
        caloriesPerMin: 3,
        description: "Core stabilization exercise",
        instructions: "Hold push-up position with body in a straight line from head to heels.",
        commonMistakes: ["Sagging hips", "Holding breath"],
        safetyTips: ["Engage glutes and abs", "Look down to keep neck neutral"],
        isDefault: true
    },
    {
        name: "Lunges",
        category: "strength",
        muscleGroups: ["quadriceps", "glutes", "hamstrings"],
        difficulty: "beginner",
        equipment: ["none"],
        caloriesPerMin: 6,
        description: "Single-leg strength exercise",
        instructions: "Step forward and lower hips until both knees bent at 90°, push back up.",
        commonMistakes: ["Front knee past toes", "Leaning forward"],
        safetyTips: ["Keep torso upright", "Step far enough forward"],
        isDefault: true
    },
    {
        name: "Dumbbell Bicep Curls",
        category: "strength",
        muscleGroups: ["biceps"],
        difficulty: "beginner",
        equipment: ["dumbbells"],
        caloriesPerMin: 4,
        description: "Isolation exercise for biceps",
        instructions: "Hold dumbbells at sides, curl up to shoulders, lower slowly.",
        commonMistakes: ["Swinging weights", "Not full range"],
        safetyTips: ["Keep elbows at sides", "Control the movement"],
        isDefault: true
    },
    {
        name: "Dumbbell Shoulder Press",
        category: "strength",
        muscleGroups: ["shoulders"],
        difficulty: "intermediate",
        equipment: ["dumbbells"],
        caloriesPerMin: 5,
        description: "Overhead pressing movement",
        instructions: "Press dumbbells from shoulder height to overhead, control descent.",
        commonMistakes: ["Arching back", "Locking elbows"],
        safetyTips: ["Keep core tight", "Don't lock elbows at top"],
        isDefault: true
    },
    {
        name: "Pull-ups",
        category: "strength",
        muscleGroups: ["back", "biceps"],
        difficulty: "advanced",
        equipment: ["pull_up_bar"],
        caloriesPerMin: 8,
        description: "Compound pulling exercise",
        instructions: "Hang from bar with overhand grip, pull chin over bar, lower with control.",
        commonMistakes: ["Kipping", "Not full extension"],
        safetyTips: ["Use controlled motion", "Don't swing"],
        isDefault: true
    },
    {
        name: "Deadlifts (Dumbbell)",
        category: "strength",
        muscleGroups: ["hamstrings", "glutes", "back"],
        difficulty: "intermediate",
        equipment: ["dumbbells"],
        caloriesPerMin: 6,
        description: "Posterior chain exercise",
        instructions: "Hold dumbbells in front of thighs, hinge at hips, lower them down legs, return to start.",
        commonMistakes: ["Rounding back", "Not hinging properly"],
        safetyTips: ["Keep back straight", "Hinge from hips, not waist"],
        isDefault: true
    },
    {
        name: "Glute Bridges",
        category: "strength",
        muscleGroups: ["glutes"],
        difficulty: "beginner",
        equipment: ["none"],
        caloriesPerMin: 3,
        description: "Glute activation",
        instructions: "Lie on back with knees bent, lift hips toward ceiling, squeeze glutes at top.",
        commonMistakes: ["Arching lower back", "Not engaging glutes"],
        safetyTips: ["Push through heels", "Keep shoulders on ground"],
        isDefault: true
    },
    {
        name: "Triceps Dips",
        category: "strength",
        muscleGroups: ["triceps"],
        difficulty: "beginner",
        equipment: ["bench"],
        caloriesPerMin: 5,
        description: "Triceps isolation",
        instructions: "Sit on bench edge, hands next to hips, walk feet forward, lower body, push back up.",
        commonMistakes: ["Flaring elbows", "Going too low"],
        safetyTips: ["Keep shoulders down", "Lower until elbows at 90°"],
        isDefault: true
    },

    // ===== CARDIO EXERCISES =====
    {
        name: "Running",
        category: "cardio",
        muscleGroups: ["quadriceps", "hamstrings", "calves"],
        difficulty: "beginner",
        equipment: ["none"],
        caloriesPerMin: 10,
        description: "Steady-state cardio",
        instructions: "Maintain a steady pace with good posture and rhythmic breathing.",
        commonMistakes: ["Overstriding", "Poor posture"],
        isDefault: true
    },
    {
        name: "Burpees",
        category: "cardio",
        muscleGroups: ["full_body"],
        difficulty: "intermediate",
        equipment: ["none"],
        caloriesPerMin: 12,
        description: "Full body explosive exercise",
        instructions: "Squat down, kick feet back into plank, do push-up, jump feet forward, jump up.",
        commonMistakes: ["Sagging hips", "Not jumping"],
        safetyTips: ["Land softly", "Modify if needed"],
        isDefault: true
    },
    {
        name: "Mountain Climbers",
        category: "cardio",
        muscleGroups: ["core", "shoulders"],
        difficulty: "intermediate",
        equipment: ["none"],
        caloriesPerMin: 9,
        description: "Dynamic plank with knee drives",
        instructions: "In plank position, alternate driving knees toward chest.",
        commonMistakes: ["Hips too high", "Not controlled"],
        safetyTips: ["Keep core engaged", "Don't let hips sag"],
        isDefault: true
    },
    {
        name: "Jump Rope",
        category: "cardio",
        muscleGroups: ["calves", "quadriceps"],
        difficulty: "beginner",
        equipment: ["none"],
        caloriesPerMin: 11,
        description: "Skipping for cardio",
        instructions: "Hold rope handles, jump with minimal ground contact, wrists do the turning.",
        commonMistakes: ["Jumping too high", "Arms wide"],
        safetyTips: ["Land softly", "Keep elbows close"],
        isDefault: true
    },
    {
        name: "Cycling (Stationary)",
        category: "cardio",
        muscleGroups: ["quadriceps", "hamstrings"],
        difficulty: "beginner",
        equipment: ["bike"],
        caloriesPerMin: 8,
        description: "Low-impact cardio",
        instructions: "Pedal at steady pace, adjust resistance as desired.",
        commonMistakes: ["Too low resistance", "Poor seat height"],
        isDefault: true
    },
    {
        name: "High Knees",
        category: "cardio",
        muscleGroups: ["quadriceps", "core"],
        difficulty: "intermediate",
        equipment: ["none"],
        caloriesPerMin: 10,
        description: "High-intensity cardio",
        instructions: "Run in place, bringing knees up to waist level as fast as possible.",
        commonMistakes: ["Leaning back", "Not lifting knees"],
        isDefault: true
    },

    // ===== HIIT EXERCISES =====
    {
        name: "Squat Jumps",
        category: "hiit",
        muscleGroups: ["quadriceps", "glutes"],
        difficulty: "intermediate",
        equipment: ["none"],
        caloriesPerMin: 12,
        description: "Explosive lower body movement",
        instructions: "Lower into squat, then jump explosively, land softly and repeat.",
        commonMistakes: ["Landing with locked knees", "Not using arms"],
        safetyTips: ["Land softly", "Keep chest up"],
        isDefault: true
    },
    {
        name: "Box Jumps",
        category: "hiit",
        muscleGroups: ["quadriceps", "glutes", "calves"],
        difficulty: "advanced",
        equipment: ["bench"],
        caloriesPerMin: 14,
        description: "Plyometric box jump",
        instructions: "Jump onto a sturdy box or platform, step down carefully.",
        commonMistakes: ["Not using arms", "Jumping too low"],
        safetyTips: ["Start with low box", "Ensure box stability"],
        isDefault: true
    },
    {
        name: "Lunge Jumps",
        category: "hiit",
        muscleGroups: ["quadriceps", "glutes"],
        difficulty: "advanced",
        equipment: ["none"],
        caloriesPerMin: 13,
        description: "Alternating explosive lunges",
        instructions: "Start in lunge, jump and switch legs in air, land in lunge on opposite side.",
        commonMistakes: ["Knee past toes", "Not controlled"],
        safetyTips: ["Land softly", "Keep front knee aligned"],
        isDefault: true
    },

    // ===== FLEXIBILITY / COOLDOWN =====
    {
        name: "Quad Stretch",
        category: "cooldown",
        muscleGroups: ["quadriceps"],
        difficulty: "beginner",
        equipment: ["none"],
        caloriesPerMin: 1,
        description: "Standing quad stretch",
        instructions: "Stand on one leg, pull other heel toward glute, hold.",
        commonMistakes: ["Twisting hips", "Not holding"],
        isDefault: true
    },
    {
        name: "Hamstring Stretch",
        category: "cooldown",
        muscleGroups: ["hamstrings"],
        difficulty: "beginner",
        equipment: ["none"],
        caloriesPerMin: 1,
        description: "Seated or standing hamstring stretch",
        instructions: "Reach toward toes with straight back, hold.",
        commonMistakes: ["Rounding back", "Bouncing"],
        isDefault: true
    },
    {
        name: "Child's Pose",
        category: "cooldown",
        muscleGroups: ["back", "hips"],
        difficulty: "beginner",
        equipment: ["yoga_mat"],
        caloriesPerMin: 1,
        description: "Restorative stretch",
        instructions: "Kneel, sit back on heels, fold forward with arms extended.",
        commonMistakes: ["Not relaxing", "Breathing shallow"],
        isDefault: true
    },
    {
        name: "Triceps Stretch",
        category: "cooldown",
        muscleGroups: ["triceps"],
        difficulty: "beginner",
        equipment: ["none"],
        caloriesPerMin: 1,
        description: "Overhead triceps stretch",
        instructions: "Reach one arm overhead and bend elbow, use other hand to gently pull.",
        commonMistakes: ["Pulling too hard", "Not keeping back straight"],
        isDefault: true
    },
    {
        name: "Chest Stretch",
        category: "cooldown",
        muscleGroups: ["chest"],
        difficulty: "beginner",
        equipment: ["none"],
        caloriesPerMin: 1,
        description: "Doorway or standing chest stretch",
        instructions: "Place forearm on wall or doorframe, gently rotate away.",
        commonMistakes: ["Too much rotation", "Not holding"],
        isDefault: true
    },
    {
        name: "Pigeon Pose",
        category: "cooldown",
        muscleGroups: ["glutes", "hips"],
        difficulty: "beginner",
        equipment: ["yoga_mat"],
        caloriesPerMin: 1,
        description: "Glute and hip stretch",
        instructions: "From plank, bring one knee forward toward wrist, extend opposite leg back, lower hips.",
        commonMistakes: ["Hips not squared", "Too much weight on knee"],
        safetyTips: ["Keep front foot flexed", "Support with hands"],
        isDefault: true
    },
    {
        name: "Cat-Cow Stretch",
        category: "cooldown",
        muscleGroups: ["back", "core"],
        difficulty: "beginner",
        equipment: ["yoga_mat"],
        caloriesPerMin: 1,
        description: "Spinal mobility",
        instructions: "On hands and knees, alternate between arching back upwards and dipping it downwards.",
        commonMistakes: ["Rushing movement", "Not breathing"],
        isDefault: true
    }
];

async function seedWorkoutExercises() {
    try {
        console.log('🌱 Seeding workout exercise database...');

        // Clear ALL existing exercises (to avoid duplicates)
        await Exercise.deleteMany({});
        console.log('🗑️ Cleared all existing exercises');

        // Insert workout exercises
        const result = await Exercise.insertMany(workoutExercises);
        console.log(`✅ Added ${result.length} workout exercises to database!`);

        // Show statistics by category
        console.log('\n📊 Exercise Statistics by Category:');
        const categories = [...new Set(workoutExercises.map(e => e.category))];
        for (const category of categories) {
            const count = workoutExercises.filter(e => e.category === category).length;
            console.log(`   ${category.charAt(0).toUpperCase() + category.slice(1)}: ${count} items`);
        }

        console.log('\n💪 Muscle Groups Distribution:');
        const muscleGroups = {};
        workoutExercises.forEach(ex => {
            ex.muscleGroups.forEach(mg => {
                muscleGroups[mg] = (muscleGroups[mg] || 0) + 1;
            });
        });
        for (const [mg, count] of Object.entries(muscleGroups).sort((a, b) => b[1] - a[1])) {
            console.log(`   ${mg}: ${count} exercises`);
        }

        console.log('\n📈 Difficulty Levels:');
        const difficultyCounts = {
            beginner: workoutExercises.filter(e => e.difficulty === 'beginner').length,
            intermediate: workoutExercises.filter(e => e.difficulty === 'intermediate').length,
            advanced: workoutExercises.filter(e => e.difficulty === 'advanced').length
        };
        for (const [level, count] of Object.entries(difficultyCounts)) {
            console.log(`   ${level.charAt(0).toUpperCase() + level.slice(1)}: ${count} items`);
        }

        console.log('\n🎉 Workout exercise database seeded successfully!');
        console.log('👉 Now test: http://localhost:3000/api/exercises');
        console.log('👉 Now use the workout planner to see these exercises!');

        mongoose.disconnect();

    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
}

// Run when connected
mongoose.connection.once('open', seedWorkoutExercises);