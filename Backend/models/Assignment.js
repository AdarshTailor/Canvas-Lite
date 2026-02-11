const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Assignment = sequelize.define('Assignment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  canvas_id: {
    type: DataTypes.STRING,
    allowNull: false
  },
  user_id: {
    type: DataTypes.INTEGER,
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
  },
  is_completed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'assignments',
  timestamps: true,

  // Composite index to use as primary key
  indexes: [
    {
      unique: true,
      fields: ['canvas_id', 'user_id']
    }
  ],

  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Assignment;
