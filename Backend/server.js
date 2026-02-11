const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { sequelize } = require('./models');
const authRoutes = require('./routes/auth');
const assignmentRoutes = require('./routes/assignments');
const canvasRoutes = require('./routes/canvas');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Canvas Calendar Backend API',
    status: 'running',
    endpoints: {
      'POST /api/validate-token': 'Validate Canvas credentials',
      'POST /api/sync': 'Sync assignments from Canvas',
      'GET /api/assignments': 'Get all assignments',
      'GET /api/sync-status': 'Get last sync time',
      'PATCH /api/assignments/:id/complete': 'Toggle assignment completion',
      'GET /api/courses': 'Get active courses',
      'GET /api/calendar-events': 'Get calendar events'
    }
  });
});

app.use('/api', authRoutes);
app.use('/api', canvasRoutes);
app.use('/api/assignments', assignmentRoutes);

// Sync database and start server
async function startServer() {
  try {
    await sequelize.sync({ force: false });
    console.log('Database synced successfully');

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

startServer();
