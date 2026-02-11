const sequelize = require('../database');
const { DataTypes } = require('sequelize');

// Import Models
const User = require('./User');
const Assignment = require('./Assignment');
const UserAssignment = require('./UserAssignment');

// --- DEFINE ASSOCIATIONS ---

// 1. Many-to-Many Relationship: User <-> Assignment
// We use UserAssignment as the "Junction" table
User.belongsToMany(Assignment, { 
  through: UserAssignment, 
  foreignKey: 'user_id',
  otherKey: 'assignment_id'
});

Assignment.belongsToMany(User, { 
  through: UserAssignment, 
  foreignKey: 'assignment_id',
  otherKey: 'user_id'
});

// 2. Direct links for easier querying (Used for .findAll({ include: [Assignment] }))
UserAssignment.belongsTo(User, { foreignKey: 'user_id' });
UserAssignment.belongsTo(Assignment, { foreignKey: 'assignment_id' });
User.hasMany(UserAssignment, { foreignKey: 'user_id' });
Assignment.hasMany(UserAssignment, { foreignKey: 'assignment_id' });

// Export everything
module.exports = {
  sequelize,
  User,
  Assignment,
  UserAssignment
};