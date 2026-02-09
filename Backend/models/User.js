const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  canvas_token: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  canvas_url: {
    type: DataTypes.STRING,
    allowNull: false
  },
  last_sync: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = User;