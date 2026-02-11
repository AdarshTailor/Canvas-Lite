const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Assignment = sequelize.define('Assignment', {
  // The Canvas ID is the global unique identifier
  canvas_id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  due_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  course_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  course_id: {
    type: DataTypes.STRING,
    allowNull: false
  },
  points_possible: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  submission_types: {
    type: DataTypes.STRING,
    allowNull: true
  },
  html_url: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'assignments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Assignment;