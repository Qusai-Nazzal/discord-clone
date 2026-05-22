const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { Channel } = require('../models');

// @route   GET api/channels
// @desc    Get all channels
// @access  Private (or Public, but usually private in Discord)
router.get('/', auth, async (req, res) => {
  try {
    let channels = await Channel.find();
    
    // Auto-create a default channel if none exist
    if (channels.length === 0) {
      const defaultChannel = await Channel.create({
        name: 'general',
        description: 'The general discussion channel.'
      });
      channels = [defaultChannel];
    }
    
    res.json(channels);
  } catch (err) {
    console.error('Fetch channels error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/channels
// @desc    Create a channel
// @access  Private
router.post('/', auth, async (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ msg: 'Channel name is required' });
  }

  // Format channel name to lowercase, no spaces (Discord style)
  const formattedName = name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_]/g, '');

  try {
    // Check if channel name exists
    const existingChannel = await Channel.findOne({ name: formattedName });
    if (existingChannel) {
      return res.status(400).json({ msg: 'Channel with this name already exists' });
    }

    const newChannel = await Channel.create({
      name: formattedName,
      description: description || '',
      creator: req.user.id
    });

    res.json(newChannel);
  } catch (err) {
    console.error('Create channel error:', err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
