const mongoose = require('mongoose');

const ReminderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please add a reminder title']
  },
  body: {
    type: String
  },
  type: {
    type: String,
    enum: ['daily', 'one_time', 'habit', 'bill', 'custom'],
    default: 'custom'
  },
  scheduledTime: {
    type: Date,
    required: true
  },
  isEnabled: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Reminder', ReminderSchema);
