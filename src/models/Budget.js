const mongoose = require('mongoose');

const BudgetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  month: {
    type: String, // format YYYY-MM
    required: true
  },
  limitAmount: {
    type: Number,
    required: [true, 'Please add a limit amount']
  },
  category: {
    type: String,
    required: [true, 'Please add a category']
  },
  currentSpent: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate budget limits for same user/month/category
BudgetSchema.index({ userId: 1, month: 1, category: 1 }, { unique: true });

module.exports = mongoose.model('Budget', BudgetSchema);
