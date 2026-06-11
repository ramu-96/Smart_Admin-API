const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const ctrl = require('../controllers/apiController');

// Authentication public routes
router.post('/auth/register', ctrl.register);
router.post('/auth/login', ctrl.login);

// Protected routes
router.use(protect);

// User settings & profile
router.get('/auth/profile', ctrl.getProfile);
router.put('/auth/settings', ctrl.updateSettings);

// Dashboard
router.get('/dashboard', ctrl.getDashboard);

// Habit Tracker
router.get('/habits', ctrl.getHabits);
router.post('/habits', ctrl.createHabit);
router.post('/habits/:id/toggle', ctrl.toggleHabit);
router.delete('/habits/:id', ctrl.deleteHabit);

// Expense & Budgets
router.get('/expenses', ctrl.getExpenses);
router.post('/expenses', ctrl.createExpense);
router.delete('/expenses/:id', ctrl.deleteExpense);
router.get('/budgets', ctrl.getBudgets);
router.post('/budgets', ctrl.createOrUpdateBudget);

// Goals
router.get('/goals', ctrl.getGoals);
router.post('/goals', ctrl.createGoal);
router.put('/goals/:id', ctrl.updateGoal);
router.delete('/goals/:id', ctrl.deleteGoal);

// Tasks (Planner)
router.get('/tasks', ctrl.getTasks);
router.post('/tasks', ctrl.createTask);
router.put('/tasks/:id', ctrl.updateTask);
router.delete('/tasks/:id', ctrl.deleteTask);

// Reminders
router.get('/reminders', ctrl.getReminders);
router.post('/reminders', ctrl.createReminder);
router.put('/reminders/:id', ctrl.updateReminder);
router.delete('/reminders/:id', ctrl.deleteReminder);

// Entertainment Log
router.get('/entertainment', ctrl.getEntertainmentLogs);
router.post('/entertainment', ctrl.createEntertainmentLog);
router.delete('/entertainment/:id', ctrl.deleteEntertainmentLog);

module.exports = router;
