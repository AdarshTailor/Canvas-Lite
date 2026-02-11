const express = require('express');
const router = express.Router();
const { User, Assignment, UserAssignment } = require('../models');
const { authenticateUser, getHashedId } = require('../middleware/auth');
const CanvasAPI = require('../services/canvasAPI');

// Validate Canvas token and create/fetch user
router.post('/validate-token', async (req, res) => {
  try {
    const { canvas_url, canvas_token } = req.body;

    if (!canvas_url || !canvas_token) {
      return res.status(400).json({ detail: 'Canvas URL and token are required' });
    }

    const canvas = new CanvasAPI(canvas_url, canvas_token);
    const isValid = await canvas.testConnection();

    if (!isValid) {
      return res.status(401).json({ detail: 'Invalid Canvas token or URL' });
    }

    const userId = getHashedId(canvas_token);
    let user = await User.findByPk(userId);

    if (!user) {
      user = await User.create({
        id: userId,
        canvas_url: canvas_url,
        canvas_token: canvas_token
      });
    }

    res.json({
      valid: true,
      message: 'Token validated successfully',
      user_id: user.id
    });
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

    const userId = getHashedId(canvas_token);
    let user = await User.findByPk(userId);

    if (!user) {
      user = await User.create({
        id: userId,
        canvas_url: canvas_url,
        canvas_token: canvas_token
      });
    }

    const canvas = new CanvasAPI(canvas_url, canvas_token);
    const canvasAssignments = await canvas.getAllAssignments();

    for (const canvasAssignment of canvasAssignments) {
      const parsed = canvas.parseAssignment(canvasAssignment);

      await Assignment.upsert(parsed);

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

// Get sync status
router.get('/sync-status', authenticateUser, (req, res) => {
  if (!req.user) return res.json({ last_sync: null });

  res.json({
    last_sync: req.user.last_sync,
    user_id: req.user.id
  });
});

module.exports = router;
