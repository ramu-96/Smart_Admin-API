const mongoose = require('mongoose');

const HabitSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Please add a habit name']
  },
  description: {
    type: String
  },
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'custom'],
    default: 'daily'
  },
  category: {
    type: String,
    required: [true, 'Please add a category']
  },
  streakCount: {
    type: Number,
    default: 0
  },
  lastCompletedDate: {
    type: Date
  },
  history: [
    {
      type: Date
    }
  ]
}, {
  timestamps: true
});

module.exports = mongoose.model('Habit', HabitSchema);
