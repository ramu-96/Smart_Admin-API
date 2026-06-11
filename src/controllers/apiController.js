const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Habit = require('../models/Habit');
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const Goal = require('../models/Goal');
const Task = require('../models/Task');
const Reminder = require('../models/Reminder');
const EntertainmentLog = require('../models/EntertainmentLog');

// Generate Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret123', {
    expiresIn: '30d'
  });
};

// ================= AUTH CONTROLLERS =================

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }
    user = await User.create({ name, email, password });
    res.status(201).json({
      success: true,
      token: generateToken(user._id),
      user: { id: user._id, name: user.name, email: user.email, settings: user.settings }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    res.status(200).json({
      success: true,
      token: generateToken(user._id),
      user: { id: user._id, name: user.name, email: user.email, settings: user.settings }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getProfile = async (req, res) => {
  res.status(200).json({ success: true, user: req.user });
};

exports.updateSettings = async (req, res) => {
  try {
    const { darkMode, notificationsEnabled } = req.body;
    if (darkMode !== undefined) req.user.settings.darkMode = darkMode;
    if (notificationsEnabled !== undefined) req.user.settings.notificationsEnabled = notificationsEnabled;
    await req.user.save();
    res.status(200).json({ success: true, user: req.user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ================= DASHBOARD SUMMARY =================

exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user._id;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // Habits completion percentage for today
    const habits = await Habit.find({ userId });
    const habitsTotal = habits.length;
    const habitsCompletedToday = habits.filter(h => {
      if (!h.lastCompletedDate) return false;
      const d = new Date(h.lastCompletedDate);
      return d >= startOfToday && d <= endOfToday;
    }).length;
    const habitCompletionRate = habitsTotal > 0 ? Math.round((habitsCompletedToday / habitsTotal) * 100) : 0;

    // Today's tasks
    const tasks = await Task.find({
      userId,
      dueDate: { $gte: startOfToday, $lte: endOfToday }
    });

    // Monthly Expense Summary
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const expenses = await Expense.find({
      userId,
      type: 'expense',
      date: { $gte: startOfMonth }
    });
    const monthlyExpenseTotal = expenses.reduce((acc, curr) => acc + curr.amount, 0);

    // Goal Progress Overview
    const goals = await Goal.find({ userId });
    const goalsOverview = goals.map(g => ({
      id: g._id,
      title: g.title,
      progress: g.progressPercentage,
      category: g.category
    }));

    res.status(200).json({
      success: true,
      data: {
        welcomeMessage: `Welcome back, ${req.user.name}!`,
        habitCompletionRate,
        tasksToday: tasks,
        monthlyExpenseTotal,
        goalsOverview
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ================= HABIT TRACKER =================

exports.getHabits = async (req, res) => {
  try {
    const habits = await Habit.find({ userId: req.user._id });
    res.status(200).json({ success: true, data: habits });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.createHabit = async (req, res) => {
  try {
    const habit = await Habit.create({ ...req.body, userId: req.user._id });
    res.status(201).json({ success: true, data: habit });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.toggleHabit = async (req, res) => {
  try {
    const habit = await Habit.findOne({ _id: req.params.id, userId: req.user._id });
    if (!habit) return res.status(404).json({ success: false, message: 'Habit not found' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isAlreadyCompletedToday = habit.history.some(d => {
      const hd = new Date(d);
      hd.setHours(0, 0, 0, 0);
      return hd.getTime() === today.getTime();
    });

    if (isAlreadyCompletedToday) {
      // Undo completion
      habit.history = habit.history.filter(d => {
        const hd = new Date(d);
        hd.setHours(0, 0, 0, 0);
        return hd.getTime() !== today.getTime();
      });
      habit.streakCount = Math.max(0, habit.streakCount - 1);
      habit.lastCompletedDate = habit.history.length > 0 ? habit.history[habit.history.length - 1] : null;
    } else {
      // Mark as completed
      habit.history.push(new Date());
      habit.streakCount += 1;
      habit.lastCompletedDate = new Date();
    }

    await habit.save();
    res.status(200).json({ success: true, data: habit });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.deleteHabit = async (req, res) => {
  try {
    await Habit.deleteOne({ _id: req.params.id, userId: req.user._id });
    res.status(200).json({ success: true, message: 'Habit deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ================= BUDGETS & EXPENSES =================

exports.getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({ userId: req.user._id }).sort({ date: -1 });
    res.status(200).json({ success: true, data: expenses });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.createExpense = async (req, res) => {
  try {
    const expense = await Expense.create({ ...req.body, userId: req.user._id });
    
    // Auto-update budget usage if category matches
    if (expense.type === 'expense') {
      const month = expense.date ? new Date(expense.date).toISOString().substring(0, 7) : new Date().toISOString().substring(0, 7);
      await Budget.findOneAndUpdate(
        { userId: req.user._id, month, category: expense.category },
        { $inc: { currentSpent: expense.amount } }
      );
    }
    
    res.status(201).json({ success: true, data: expense });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, userId: req.user._id });
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
    
    if (expense.type === 'expense') {
      const month = new Date(expense.date).toISOString().substring(0, 7);
      await Budget.findOneAndUpdate(
        { userId: req.user._id, month, category: expense.category },
        { $inc: { currentSpent: -expense.amount } }
      );
    }
    
    await expense.deleteOne();
    res.status(200).json({ success: true, message: 'Expense deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getBudgets = async (req, res) => {
  try {
    const budgets = await Budget.find({ userId: req.user._id });
    res.status(200).json({ success: true, data: budgets });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.createOrUpdateBudget = async (req, res) => {
  try {
    const { month, limitAmount, category } = req.body;
    
    // Calculate total spend for this category & month
    const startOfMonth = new Date(`${month}-01T00:00:00Z`);
    const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0, 23, 59, 59);
    
    const expenses = await Expense.find({
      userId: req.user._id,
      type: 'expense',
      category,
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });
    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    const budget = await Budget.findOneAndUpdate(
      { userId: req.user._id, month, category },
      { limitAmount, currentSpent: totalSpent },
      { new: true, upsert: true }
    );
    res.status(200).json({ success: true, data: budget });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ================= GOAL TRACKER =================

exports.getGoals = async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.user._id });
    res.status(200).json({ success: true, data: goals });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.createGoal = async (req, res) => {
  try {
    const goal = await Goal.create({ ...req.body, userId: req.user._id });
    res.status(201).json({ success: true, data: goal });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.updateGoal = async (req, res) => {
  try {
    const goal = await Goal.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true }
    );
    res.status(200).json({ success: true, data: goal });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.deleteGoal = async (req, res) => {
  try {
    await Goal.deleteOne({ _id: req.params.id, userId: req.user._id });
    res.status(200).json({ success: true, message: 'Goal deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ================= DAILY PLANNER =================

exports.getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user._id }).sort({ dueDate: 1 });
    res.status(200).json({ success: true, data: tasks });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.createTask = async (req, res) => {
  try {
    const task = await Task.create({ ...req.body, userId: req.user._id });
    res.status(201).json({ success: true, data: task });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true }
    );
    res.status(200).json({ success: true, data: task });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    await Task.deleteOne({ _id: req.params.id, userId: req.user._id });
    res.status(200).json({ success: true, message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ================= REMINDERS =================

exports.getReminders = async (req, res) => {
  try {
    const reminders = await Reminder.find({ userId: req.user._id });
    res.status(200).json({ success: true, data: reminders });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.createReminder = async (req, res) => {
  try {
    const reminder = await Reminder.create({ ...req.body, userId: req.user._id });
    res.status(201).json({ success: true, data: reminder });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.updateReminder = async (req, res) => {
  try {
    const reminder = await Reminder.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true }
    );
    res.status(200).json({ success: true, data: reminder });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.deleteReminder = async (req, res) => {
  try {
    await Reminder.deleteOne({ _id: req.params.id, userId: req.user._id });
    res.status(200).json({ success: true, message: 'Reminder deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ================= ENTERTAINMENT LOGS =================

exports.getEntertainmentLogs = async (req, res) => {
  try {
    const logs = await EntertainmentLog.find({ userId: req.user._id }).sort({ date: -1 });
    res.status(200).json({ success: true, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.createEntertainmentLog = async (req, res) => {
  try {
    const log = await EntertainmentLog.create({ ...req.body, userId: req.user._id });
    res.status(201).json({ success: true, data: log });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.deleteEntertainmentLog = async (req, res) => {
  try {
    await EntertainmentLog.deleteOne({ _id: req.params.id, userId: req.user._id });
    res.status(200).json({ success: true, message: 'Log deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
