const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const sequelize = require('./database');
const apiRoutes = require('./routes/api');

// Import models to register them
const User = require('./models/User');
const Assignment = require('./models/Assignment');

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
    // Sync models with database (create tables if they don't exist)
    await sequelize.sync({ alter: true });
    console.log('✅ Database synced successfully');

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
