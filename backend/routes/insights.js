  const express = require('express');
const Activity = require('../models/Activity');
const WeeklyGoal = require('../models/WeeklyGoal');
const auth = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/weekly', auth, async (req, res) => {
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay()); 
  const activities = await Activity.find({ user: req.user.id, timestamp: { $gte: weekStart } });
  const totals = {};
  activities.forEach(a => {
    totals[a.category] = (totals[a.category] || 0) + a.co2Emissions;
  });
  const highest = Object.entries(totals).sort((a,b) => b[1]-a[1])[0];
  let tip = '';
  let targetReduction = 0;
  if (highest) {
    if (highest[0] === 'transport') {
      tip = 'Try cycling or walking for short trips to reduce your transport emissions!';
      targetReduction = Math.round(highest[1] * 0.2); 
    } else if (highest[0] === 'food') {
      tip = 'Try eating less beef or more plant-based meals this week!';
      targetReduction = Math.round(highest[1] * 0.15);
    } else if (highest[0] === 'energy') {
      tip = 'Reduce electricity use by turning off unused devices!';
      targetReduction = Math.round(highest[1] * 0.1);
    }
  }
  res.json({ category: highest?.[0], tip, targetReduction, total: highest?.[1] || 0 });
});

module.exports = router;
