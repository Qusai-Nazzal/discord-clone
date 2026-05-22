const { getIsFallback } = require('../config/db');
const UserMongoose = require('./User');
const ChannelMongoose = require('./Channel');
const MessageMongoose = require('./Message');

const { UserFallback, ChannelFallback, MessageFallback } = require('./fallbackDb');

module.exports = {
  get User() {
    return getIsFallback() ? UserFallback : UserMongoose;
  },
  get Channel() {
    return getIsFallback() ? ChannelFallback : ChannelMongoose;
  },
  get Message() {
    return getIsFallback() ? MessageFallback : MessageMongoose;
  }
};
