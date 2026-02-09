const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Assignment = require('../models/Assignment');
const CanvasAPI = require('../services/canvasAPI');

// Helper function to get or create user
async function getOrCreateUser(canvasUrl, canvasToken) {
  let user = await User.findOne({ where: { canvas_token: canvasToken } });
  
  if (!user) {
    user = await User.create({
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

// Sync assignments from Canvas
router.post('/sync', async (req, res) => {
  try {
    const { canvas_url, canvas_token } = req.body;

    if (!canvas_url || !canvas_token) {
      return res.status(400).json({ detail: 'Canvas URL and token are required' });
    }

    // Get or create user
    const user = await getOrCreateUser(canvas_url, canvas_token);

    // Fetch assignments from Canvas
    const canvas = new CanvasAPI(canvas_url, canvas_token);
    const canvasAssignments = await canvas.getAllAssignments();

    let syncedCount = 0;

    for (const canvasAssignment of canvasAssignments) {
      const parsed = canvas.parseAssignment(canvasAssignment);

      // Check if assignment already exists
      const existing = await Assignment.findOne({
        where: {
          canvas_id: parsed.canvas_id,
          user_id: user.id
        }
      });

      if (existing) {
        // Update existing assignment
        await existing.update(parsed);
      } else {
        // Create new assignment
        await Assignment.create({
          user_id: user.id,
          ...parsed
        });
      }

      syncedCount++;
    }

    // Update last sync time
    user.last_sync = new Date();
    await user.save();

    res.json({
      success: true,
      message: `Successfully synced ${syncedCount} assignments`,
      assignments_synced: syncedCount,
      last_sync: user.last_sync
    });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ detail: error.message });
  }
});

// Get all assignments for a user
router.get('/assignments', async (req, res) => {
  try {
    const { canvas_token } = req.query;

    if (!canvas_token) {
      return res.status(400).json({ detail: 'Canvas token is required' });
    }

    const user = await User.findOne({ where: { canvas_token } });

    if (!user) {
      return res.status(404).json({ detail: 'User not found. Please validate token first.' });
    }

    const assignments = await Assignment.findAll({
      where: { user_id: user.id },
      order: [['due_at', 'ASC']]
    });

    res.json(assignments);
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({ detail: error.message });
  }
});

// Get sync status
router.get('/sync-status', async (req, res) => {
  try {
    const { canvas_token } = req.query;

    if (!canvas_token) {
      return res.json({ last_sync: null });
    }

    const user = await User.findOne({ where: { canvas_token } });

    if (!user) {
      return res.json({ last_sync: null });
    }

    res.json({
      last_sync: user.last_sync,
      user_id: user.id
    });
  } catch (error) {
    console.error('Sync status error:', error);
    res.status(500).json({ detail: error.message });
  }
});

// Get courses with start/end dates from Canvas
router.get('/courses', async (req, res) => {
  try {
    const { canvas_token } = req.query;

    if (!canvas_token) {
      return res.status(400).json({ detail: 'Canvas token is required' });
    }

    const user = await User.findOne({ where: { canvas_token } });

    if (!user) {
      return res.status(404).json({ detail: 'User not found. Please validate token first.' });
    }

    const canvas = new CanvasAPI(user.canvas_url, canvas_token);
    const courses = await canvas.getCourses();

    const parsed = courses
      .filter(c => c.start_at || c.end_at)
      .map(course => ({
        id: course.id,
        name: course.name || 'Unknown Course',
        course_code: course.course_code || '',
        start_at: course.start_at || null,
        end_at: course.end_at || null
      }));

    res.json(parsed);
  } catch (error) {
    console.error('Courses error:', error);
    res.status(500).json({ detail: error.message });
  }
});

// Get calendar events (class times) from Canvas
router.get('/calendar-events', async (req, res) => {
  try {
    const { canvas_token, start_date, end_date } = req.query;

    if (!canvas_token) {
      return res.status(400).json({ detail: 'Canvas token is required' });
    }

    const user = await User.findOne({ where: { canvas_token } });

    if (!user) {
      return res.status(404).json({ detail: 'User not found. Please validate token first.' });
    }

    // Default to current month range if no dates provided
    const now = new Date();
    const start = start_date || new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const end = end_date || new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString();

    const canvas = new CanvasAPI(user.canvas_url, canvas_token);
    const events = await canvas.getCalendarEvents(start, end);

    // Map to a clean format
    const calendarEvents = events.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description || '',
      start_at: event.start_at,
      end_at: event.end_at,
      location_name: event.location_name || '',
      location_address: event.location_address || '',
      context_name: event.context_name || '',
      context_code: event.context_code || '',
      type: 'class_event'
    }));

    res.json(calendarEvents);
  } catch (error) {
    console.error('Calendar events error:', error);
    res.status(500).json({ detail: error.message });
  }
});

// Toggle assignment completion
router.patch('/assignments/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const { is_completed } = req.query;

    const assignment = await Assignment.findByPk(id);

    if (!assignment) {
      return res.status(404).json({ detail: 'Assignment not found' });
    }

    assignment.is_completed = is_completed === 'true';
    await assignment.save();

    res.json({
      success: true,
      is_completed: assignment.is_completed
    });
  } catch (error) {
    console.error('Toggle completion error:', error);
    res.status(500).json({ detail: error.message });
  }
});

module.exports = router;