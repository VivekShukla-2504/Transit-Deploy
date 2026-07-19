const mongoose = require('mongoose');

const EXPENSE_CATEGORIES = ['Toll', 'Maintenance', 'Parking', 'Fine', 'Other'];

const expenseSchema = new mongoose.Schema(
  {
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip' },
    category: { type: String, enum: EXPENSE_CATEGORIES, default: 'Other' },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, default: Date.now },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = { Expense: mongoose.model('Expense', expenseSchema), EXPENSE_CATEGORIES };
