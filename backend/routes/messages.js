const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { Message } = require('../models');

// @route   GET api/messages/:channelId
// @desc    Get messages for a channel
// @access  Private
router.get('/:channelId', auth, async (req, res) => {
  try {
    const messages = await Message.find({ channel: req.params.channelId })
      .populate('sender');
    
    res.json(messages);
  } catch (err) {
    console.error('Fetch messages error:', err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
