const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

// 1. IMPORT FROM THE MODELS INDEX
// This ensures User, Assignment, and UserAssignment are linked via associations
const { sequelize, User, Assignment, UserAssignment } = require('./models');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.json({
    message: '📚 Canvas Calendar Backend API',
    status: 'running',
    endpoints: {
      'GET /api': 'API status',
      'POST /api/validate-token': 'Validate Canvas credentials',
      'POST /api/sync': 'Sync assignments from Canvas',
      'GET /api/assignments': 'Get all assignments',
      'GET /api/sync-status': 'Get last sync time',
      'PATCH /api/assignments/:id/complete': 'Toggle assignment completion'
    },
    docs: 'Visit http://localhost:8000/api for API status'
  });
});

app.use('/api', apiRoutes);

// Sync database and start server
async function startServer() {
  try {
    // 2. SYNC MODELS
    // Using { force: false } so we don't wipe data on every restart.
    // Use { alter: true } only if you are actively changing column names.
    await sequelize.sync({ force: false });
    console.log('✅ Database synced successfully with Associations');

    // 3. AUTOMATIC STARTUP BACKUP
    // We backup the 'user_assignments' table because it holds the 
    // unique user data (is_completed status) that isn't on Canvas.
    try {
      // Ensure backup table exists
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS user_assignments_backup (
          user_id TEXT,
          assignment_id TEXT,
          is_completed BOOLEAN,
          createdAt DATETIME,
          updatedAt DATETIME,
          PRIMARY KEY (user_id, assignment_id)
        )
      `);

      // Clear old backup and copy current data
      await sequelize.query("DELETE FROM user_assignments_backup");
      await sequelize.query(`
        INSERT INTO user_assignments_backup (user_id, assignment_id, is_completed, createdAt, updatedAt)
        SELECT user_id, assignment_id, is_completed, createdAt, updatedAt FROM user_assignments
      `);
      console.log('📂 Startup backup of user progress completed.');
    } catch (backupError) {
      console.error('⚠️ Backup failed:', backupError.message);
    }

    // 4. START LISTENING
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📡 API available at http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Error starting server:', error);
    process.exit(1);
  }
}

startServer();