const mongoose = require('mongoose');

const EntertainmentLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  activityName: {
    type: String,
    required: [true, 'Please add an activity name']
  },
  durationMinutes: {
    type: Number,
    required: [true, 'Please add duration in minutes']
  },
  category: {
    type: String,
    enum: ['gaming', 'social_media', 'streaming', 'other'],
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('EntertainmentLog', EntertainmentLogSchema);
