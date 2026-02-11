const { DataTypes } = require('sequelize');
const sequelize = require('../database');
const { encrypt, decrypt } = require('../services/crypto');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  canvas_token: {
    type: DataTypes.STRING,
    allowNull: false,
    // THE MAGIC HAPPENS HERE:
    set(value) {
      this.setDataValue('canvas_token', encrypt(value));
    },
    get() {
      const rawValue = this.getDataValue('canvas_token');
      return rawValue ? decrypt(rawValue) : null;
    }
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
  timestamps: true
});

module.exports = User;