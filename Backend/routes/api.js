const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { User, Assignment, UserAssignment } = require('../models'); // Loads from index.js automatically
const CanvasAPI = require('../services/canvasAPI');

/**
 * SECURITY HELPER: Hashing function for IDs
 * Converts the Canvas Token into a consistent, non-reversible string.
 * This ensures the raw token isn't used as a Primary Key in the database.
 */
const getHashedId = (token) => {
    return crypto.createHash('sha256').update(token).digest('hex');
};

// Helper function to get or create user
async function getOrCreateUser(canvasUrl, canvasToken) {
    const userId = getHashedId(canvasToken);
    let user = await User.findByPk(userId);
    
    if (!user) {
        user = await User.create({
            id: userId,
            canvas_url: canvasUrl,
            canvas_token: canvasToken
        });
    }
    return user;
}

// Root endpoint
router.get('/', (req, res) => {
    res.json({ message: 'Canvas Calendar API is running' });
});

// Validate Canvas token
router.post('/validate-token', async (req, res) => {
    try {
        const { canvas_url, canvas_token } = req.body;

        if (!canvas_url || !canvas_token) {
            return res.status(400).json({ detail: 'Canvas URL and token are required' });
        }

        const canvas = new CanvasAPI(canvas_url, canvas_token);
        const isValid = await canvas.testConnection();

        if (isValid) {
            const user = await getOrCreateUser(canvas_url, canvas_token);
            res.json({
                valid: true,
                message: 'Token validated successfully',
                user_id: user.id
            });
        } else {
            res.status(401).json({ detail: 'Invalid Canvas token or URL' });
        }
    } catch (error) {
        console.error('Validation error:', error);
        res.status(500).json({ detail: error.message });
    }
});

/**
 * SYNC ASSIGNMENTS
 * Multi-user logic:
 * 1. Upsert global assignment data (shared with classmates).
 * 2. Link this specific user to those assignments in the bridge table.
 */
router.post('/sync', async (req, res) => {
    try {
        const { canvas_url, canvas_token } = req.body;

        if (!canvas_url || !canvas_token) {
            return res.status(400).json({ detail: 'Canvas URL and token are required' });
        }

        const user = await getOrCreateUser(canvas_url, canvas_token);
        const canvas = new CanvasAPI(canvas_url, canvas_token);
        const canvasAssignments = await canvas.getAllAssignments();

        for (const canvasAssignment of canvasAssignments) {
            const parsed = canvas.parseAssignment(canvasAssignment);

            // 1. Save assignment details (Shared by all users)
            await Assignment.upsert(parsed);

            // 2. Link User to Assignment (Personal status)
            // findOrCreate ensures we don't reset 'is_completed' if it already exists
            await UserAssignment.findOrCreate({
                where: { 
                    user_id: user.id, 
                    assignment_id: parsed.canvas_id 
                },
                defaults: { is_completed: false }
            });
        }

        user.last_sync = new Date();
        await user.save();

        res.json({
            success: true,
            message: `Successfully synced ${canvasAssignments.length} assignments`,
            last_sync: user.last_sync
        });
    } catch (error) {
        console.error('Sync error:', error);
        res.status(500).json({ detail: error.message });
    }
});

/**
 * GET ASSIGNMENTS
 * Performs a JOIN between UserAssignments and the global Assignments table.
 */
router.get('/assignments', async (req, res) => {
    try {
        const { canvas_token } = req.query;

        if (!canvas_token) {
            return res.status(400).json({ detail: 'Canvas token is required' });
        }

        const userId = getHashedId(canvas_token);

        // Fetch user progress and include the actual assignment details
        const userAssignments = await UserAssignment.findAll({
            where: { user_id: userId },
            include: [{
                model: Assignment,
                required: true
            }]
        });

        // Format for frontend
        const result = userAssignments.map(ua => ({
            ...ua.Assignment.toJSON(),
            is_completed: ua.is_completed
        })).sort((a, b) => new Date(a.due_at) - new Date(b.due_at));

        res.json(result);
    } catch (error) {
        console.error('Get assignments error:', error);
        res.status(500).json({ detail: error.message });
    }
});

// Get sync status
router.get('/sync-status', async (req, res) => {
    try {
        const { canvas_token } = req.query;
        if (!canvas_token) return res.json({ last_sync: null });

        const userId = getHashedId(canvas_token);
        const user = await User.findByPk(userId);

        if (!user) return res.json({ last_sync: null });

        res.json({
            last_sync: user.last_sync,
            user_id: user.id
        });
    } catch (error) {
        res.status(500).json({ detail: error.message });
    }
});

// Toggle assignment completion (Updates the bridge table only)
router.patch('/assignments/:canvas_id/complete', async (req, res) => {
    try {
        const { canvas_id } = req.params;
        const { is_completed, canvas_token } = req.body;

        if (!canvas_token) return res.status(400).json({ detail: 'Token required' });
        const userId = getHashedId(canvas_token);

        const link = await UserAssignment.findOne({
            where: { user_id: userId, assignment_id: canvas_id }
        });

        if (!link) {
            return res.status(404).json({ detail: 'Assignment link not found' });
        }

        link.is_completed = is_completed === true || is_completed === 'true';
        await link.save();

        res.json({
            success: true,
            is_completed: link.is_completed
        });
    } catch (error) {
        console.error('Toggle completion error:', error);
        res.status(500).json({ detail: error.message });
    }
});

/**
 * REMAINING EXTERNAL CANVAS FETCHES
 */
router.get('/courses', async (req, res) => {
    try {
        const { canvas_token } = req.query;
        const userId = getHashedId(canvas_token);
        const user = await User.findByPk(userId);

        if (!user) return res.status(404).json({ detail: 'User not found' });

        const canvas = new CanvasAPI(user.canvas_url, canvas_token);
        const courses = await canvas.getCourses();

        res.json(courses.map(course => ({
            id: course.id,
            name: course.name || 'Unknown Course',
            start_at: course.start_at,
            end_at: course.end_at
        })));
    } catch (error) {
        res.status(500).json({ detail: error.message });
    }
});

router.get('/calendar-events', async (req, res) => {
    try {
        const { canvas_token, start_date, end_date } = req.query;
        const userId = getHashedId(canvas_token);
        const user = await User.findByPk(userId);

        if (!user) return res.status(404).json({ detail: 'User not found' });

        const now = new Date();
        const start = start_date || new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString();
        const end = end_date || new Date(now.getFullYear(), now.getMonth() + 4, 0).toISOString();

        const canvas = new CanvasAPI(user.canvas_url, canvas_token);
        const events = await canvas.getCalendarEvents(start, end);

        res.json(events.map(event => ({
            id: event.id,
            title: event.title,
            start_at: event.start_at,
            end_at: event.end_at,
            type: 'class_event'
        })));
    } catch (error) {
        res.status(500).json({ detail: error.message });
    }
});

module.exports = router;