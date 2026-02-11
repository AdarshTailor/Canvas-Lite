const crypto = require('crypto');
const { User } = require('../models');

const getHashedId = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Auth middleware — extracts canvas_token from body or query,
 * hashes it, looks up the user, and attaches to req.
 *
 * Sets: req.userId, req.user (if found)
 */
async function authenticateUser(req, res, next) {
  const canvas_token = req.body.canvas_token || req.query.canvas_token;

  if (!canvas_token) {
    return res.status(400).json({ detail: 'Canvas token is required' });
  }

  req.userId = getHashedId(canvas_token);
  req.canvasToken = canvas_token;

  try {
    const user = await User.findByPk(req.userId);
    req.user = user; // may be null for new users (validate-token handles creation)
  } catch (error) {
    return res.status(500).json({ detail: 'Error looking up user' });
  }

  next();
}

module.exports = { authenticateUser, getHashedId };
