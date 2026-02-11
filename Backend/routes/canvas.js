const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const CanvasAPI = require('../services/canvasAPI');

// Get active courses from Canvas
router.get('/courses', authenticateUser, async (req, res) => {
  try {
    if (!req.user) return res.status(404).json({ detail: 'User not found' });

    const canvas = new CanvasAPI(req.user.canvas_url, req.canvasToken);
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

// Get calendar events from Canvas
router.get('/calendar-events', authenticateUser, async (req, res) => {
  try {
    if (!req.user) return res.status(404).json({ detail: 'User not found' });

    const { start_date, end_date } = req.query;
    const now = new Date();
    const start = start_date || new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString();
    const end = end_date || new Date(now.getFullYear(), now.getMonth() + 4, 0).toISOString();

    const canvas = new CanvasAPI(req.user.canvas_url, req.canvasToken);
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
