const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const ClassSchedule = sequelize.define('ClassSchedule', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.STRING,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  course_id: {
    type: DataTypes.STRING,
    allowNull: false
  },
  course_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  day_of_week: {
    type: DataTypes.INTEGER,
    allowNull: false  // 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri
  },
  start_time: {
    type: DataTypes.STRING,
    allowNull: false  // "10:00" (24h format)
  },
  end_time: {
    type: DataTypes.STRING,
    allowNull: false  // "10:50" (24h format)
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true
  },
  color: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '#3174ad'
  }
}, {
  tableName: 'class_schedules',
  timestamps: true
});

module.exports = ClassSchedule;
