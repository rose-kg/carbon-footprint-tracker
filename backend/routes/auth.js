const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();


router.post('/register', async (req, res) => {
  const { fullName, email, username, password, confirmPassword } = req.body;
  if (!fullName || !email || !username || !password || !confirmPassword) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match.' });
  }
  try {
    const user = new User({ fullName, email, username, password });
    await user.save();
    res.json({ success: true });
  } catch (e) {
    let msg = 'Registration failed';
    if (e.code === 11000) {
      if (e.keyPattern && e.keyPattern.email) msg = 'Email already registered';
      else if (e.keyPattern && e.keyPattern.username) msg = 'Username taken';
    }
    res.status(400).json({ error: msg });
  }
});

router.post('/login', async (req, res) => {
  const user = await User.findOne({ username: req.body.username });
  if (!user || !(await user.comparePassword(req.body.password))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token });
});

module.exports = router;
