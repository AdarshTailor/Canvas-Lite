const sequelize = require('../database');

// Import Models
const User = require('./User');
const Assignment = require('./Assignment');
const UserAssignment = require('./UserAssignment');

// --- DEFINE ASSOCIATIONS ---
// Direct links via the bridge table for querying with includes
UserAssignment.belongsTo(User, { foreignKey: 'user_id' });
UserAssignment.belongsTo(Assignment, { foreignKey: 'assignment_id' });
User.hasMany(UserAssignment, { foreignKey: 'user_id' });
Assignment.hasMany(UserAssignment, { foreignKey: 'assignment_id' });

module.exports = {
  sequelize,
  User,
  Assignment,
  UserAssignment
};