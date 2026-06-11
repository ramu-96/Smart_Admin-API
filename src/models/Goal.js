const mongoose = require('mongoose');

const MilestoneSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  isCompleted: {
    type: Boolean,
    default: false
  }
});

const GoalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please add a goal title']
  },
  description: {
    type: String
  },
  category: {
    type: String,
    enum: ['financial', 'personal', 'career', 'health'],
    required: true
  },
  targetValue: {
    type: Number,
    required: true
  },
  currentValue: {
    type: Number,
    default: 0
  },
  targetDate: {
    type: Date,
    required: true
  },
  milestones: [MilestoneSchema]
}, {
  timestamps: true
});

GoalSchema.virtual('progressPercentage').get(function() {
  if (!this.targetValue) return 0;
  const percentage = (this.currentValue / this.targetValue) * 100;
  return Math.min(Math.round(percentage), 100);
});

GoalSchema.set('toJSON', { virtuals: true });
GoalSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Goal', GoalSchema);
