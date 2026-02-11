const express = require('express');
const router = express.Router();
const { ClassSchedule } = require('../models');
const { authenticateUser } = require('../middleware/auth');

// Get user's class schedule
router.get('/schedule', authenticateUser, async (req, res) => {
  try {
    const entries = await ClassSchedule.findAll({
      where: { user_id: req.userId },
      order: [['day_of_week', 'ASC'], ['start_time', 'ASC']]
    });
    res.json(entries);
  } catch (error) {
    console.error('Get schedule error:', error);
    res.status(500).json({ detail: error.message });
  }
});

// Save/replace entire schedule
router.post('/schedule', authenticateUser, async (req, res) => {
  try {
    const { entries } = req.body;

    if (!Array.isArray(entries)) {
      return res.status(400).json({ detail: 'entries must be an array' });
    }

    // Delete existing schedule for this user
    await ClassSchedule.destroy({ where: { user_id: req.userId } });

    // Insert new entries
    const created = await ClassSchedule.bulkCreate(
      entries.map(entry => ({
        user_id: req.userId,
        course_id: entry.course_id,
        course_name: entry.course_name,
        day_of_week: entry.day_of_week,
        start_time: entry.start_time,
        end_time: entry.end_time,
        location: entry.location || null,
        color: entry.color || '#3174ad'
      }))
    );

    res.json({ success: true, count: created.length });
  } catch (error) {
    console.error('Save schedule error:', error);
    res.status(500).json({ detail: error.message });
  }
});

// Delete a single schedule entry
router.delete('/schedule/:id', authenticateUser, async (req, res) => {
  try {
    const deleted = await ClassSchedule.destroy({
      where: { id: req.params.id, user_id: req.userId }
    });

    if (!deleted) {
      return res.status(404).json({ detail: 'Schedule entry not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete schedule error:', error);
    res.status(500).json({ detail: error.message });
  }
});

module.exports = router;
