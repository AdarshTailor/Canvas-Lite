const express = require('express');
const router = express.Router();
const { Assignment, UserAssignment } = require('../models');
const { authenticateUser } = require('../middleware/auth');

// Get all assignments for a user
router.get('/', authenticateUser, async (req, res) => {
  try {
    const userAssignments = await UserAssignment.findAll({
      where: { user_id: req.userId },
      include: [{
        model: Assignment,
        required: true
      }]
    });

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

// Toggle assignment completion
router.patch('/:canvas_id/complete', authenticateUser, async (req, res) => {
  try {
    const { canvas_id } = req.params;
    const { is_completed } = req.body;

    const link = await UserAssignment.findOne({
      where: { user_id: req.userId, assignment_id: canvas_id }
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

module.exports = router;
