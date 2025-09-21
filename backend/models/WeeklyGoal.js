const mongoose = require('mongoose');
const WeeklyGoalSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  weekStart: Date,
  category: String,
  targetReduction: Number,
  tip: String,
  progress: Number
});
module.exports = mongoose.model('WeeklyGoal', WeeklyGoalSchema);
