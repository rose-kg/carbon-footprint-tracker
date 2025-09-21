const express = require('express');
const Activity = require('../models/Activity');
const User = require('../models/User');
const auth = require('../middleware/authMiddleware');
const router = express.Router();

// Get user activities
router.get('/', auth, async (req, res) => {
  const activities = await Activity.find({ user: req.user.id });
  console.log(`[GET /api/activities] User: ${req.user.id}, Activities found: ${activities.length}`);
  res.json(activities);
});

// Add activity
router.post('/', auth, async (req, res) => {
  const activity = new Activity({ ...req.body, user: req.user.id });
  await activity.save();
  console.log(`[POST /api/activities] User: ${req.user.id}, Activity saved: ${activity._id}`);
  res.json(activity);
});

// Weekly summary
router.get('/weekly', auth, async (req, res) => {
  const weekAgo = new Date(Date.now() - 7*24*60*60*1000);
  const activities = await Activity.find({ user: req.user.id, timestamp: { $gte: weekAgo } });
  res.json(activities);
});

// Community average
router.get('/community-average', auth, async (req, res) => {
  const all = await Activity.aggregate([
    { $group: { _id: "$user", total: { $sum: "$co2Emissions" } } }
  ]);
  const avg = all.reduce((sum, u) => sum + u.total, 0) / (all.length || 1);
  res.json({ average: avg });
});

// Leaderboard
router.get('/leaderboard', async (req, res) => {
  const leaderboard = await Activity.aggregate([
    { $group: { _id: "$user", total: { $sum: "$co2Emissions" } } },
    { $sort: { total: 1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user"
      }
    },
    { $unwind: "$user" },
    { $project: { username: "$user.username", total: 1 } }
  ]);
  res.json(leaderboard);
});


// Delete activity
router.delete('/:id', auth, async (req, res) => {
  try {
    const activity = await Activity.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!activity) {
      return res.status(404).send('Activity not found');
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router;
