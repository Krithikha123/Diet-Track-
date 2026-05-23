const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// CORS Configuration
app.use(cors({
    origin: ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:8080', 'file://'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight requests
app.options('*', cors());

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dietTrack';
mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('✅ Connected to MongoDB:', MONGODB_URI))
    .catch(err => {
        console.error('❌ MongoDB connection error:', err.message);
        console.log('⚠️ Attempting to continue without MongoDB...');
    });

// Import routes correctly
const authRoutes = require('./routes/auth').router; // Note: .router
const profileRoutes = require('./routes/profile');
const foodRoutes = require('./routes/food');
const workoutRoutes = require('./routes/workout');
const logRoutes = require('./routes/logs');
const dietPlanRoutes = require('./routes/diet-plans');
const nutrientRoutes = require('./routes/nutrient');
const feedbackRoutes = require('./routes/feedback');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/food', foodRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/diet-plans', dietPlanRoutes);
app.use('/api/nutrient', nutrientRoutes);
app.use('/api/feedback', feedbackRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        database: dbStatus,
        endpoints: {
            auth: '/api/auth',
            profile: '/api/profile',
            food: '/api/food',
            health: '/api/health'
        }
    });
});

// Test endpoint            
app.get('/api/test', (req, res) => {
    res.json({
        message: '✅ API is working!',
        timestamp: new Date().toISOString(),
        instructions: 'Use POST /api/auth/register to create an account'
    });
});

// Default route
app.get('/', (req, res) => {
    res.json({
        message: 'DietTrack API is running',
        version: '1.0.0',
        docs: {
            register: 'POST /api/auth/register',
            login: 'POST /api/auth/login',
            profile: 'POST /api/profile/save',
            test: 'GET /api/test',
            health: 'GET /api/health'
        }
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Route not found',
        requestedUrl: req.url,
        method: req.method
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err.stack);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 Server started successfully!`);
    console.log(`🌐 API URL: http://localhost:${PORT}`);
    console.log(`📞 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔧 Test endpoint: http://localhost:${PORT}/api/test`);
    console.log(`\n📋 Available endpoints:`);
    console.log(`   POST /api/auth/register - Register new user`);
    console.log(`   POST /api/auth/login - Login user`);
    console.log(`   POST /api/profile/save - Save user profile`);
    console.log(`   GET  /api/profile - Get user profile`);
    console.log(`\n📝 Example registration:`);
    console.log(`   curl -X POST http://localhost:${PORT}/api/auth/register \\`);
    console.log(`        -H "Content-Type: application/json" \\`);
    console.log(`        -d '{"name":"John Doe","email":"john@example.com","username":"john","password":"password123"}'`);
});