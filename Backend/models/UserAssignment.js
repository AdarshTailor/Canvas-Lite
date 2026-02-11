const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const UserAssignment = sequelize.define('UserAssignment', {
  // Composite Primary Key: A link between a specific User and a specific Assignment
  user_id: {
    type: DataTypes.STRING,
    primaryKey: true,
    references: { model: 'users', key: 'id' }
  },
  assignment_id: {
    type: DataTypes.STRING,
    primaryKey: true,
    references: { model: 'assignments', key: 'canvas_id' }
  },
  is_completed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'user_assignments',
  timestamps: true
});

module.exports = UserAssignment;