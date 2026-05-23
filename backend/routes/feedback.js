const express = require('express');
const router = express.Router();
const Feedback = require('../models/feedback');
const User = require('../models/User');
const { verifyToken } = require('./auth');

// Submit feedback (authenticated users)
router.post('/submit', verifyToken, async (req, res) => {
    try {
        const { rating, category, message } = req.body;

        // Get user info from token or localStorage (you'll need to pass this)
        const user = await User.findById(req.userId);

        const feedback = new Feedback({
            userId: req.userId,
            userName: user.name,
            userEmail: user.email,
            rating,
            category,
            message
        });

        await feedback.save();

        res.json({
            success: true,
            message: 'Feedback submitted successfully',
            data: feedback
        });
    } catch (error) {
        console.error('Feedback submission error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while submitting feedback'
        });
    }
});

// Get user's own feedback
router.get('/my-feedback', verifyToken, async (req, res) => {
    try {
        const feedback = await Feedback.find({ userId: req.userId })
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: feedback
        });
    } catch (error) {
        console.error('Error fetching feedback:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Admin routes (you can add admin middleware later)
router.get('/all', verifyToken, async (req, res) => {
    try {
        const feedback = await Feedback.find()
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: feedback
        });
    } catch (error) {
        console.error('Error fetching all feedback:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

router.put('/:id/respond', verifyToken, async (req, res) => {
    try {
        const { adminResponse, status } = req.body;

        const feedback = await Feedback.findByIdAndUpdate(
            req.params.id,
            {
                adminResponse,
                status,
                updatedAt: Date.now()
            },
            { new: true }
        );

        res.json({
            success: true,
            message: 'Response added',
            data: feedback
        });
    } catch (error) {
        console.error('Error responding to feedback:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;