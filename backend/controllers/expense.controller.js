const { Expense, EXPENSE_CATEGORIES } = require("../models/Expense");
const { Vehicle } = require("../models/Vehicle");

// GET /api/expenses
exports.getExpenses = async (req, res) => {
  try {
    const { vehicle, category } = req.query;

    const filter = {};

    if (vehicle) filter.vehicle = vehicle;
    if (category) filter.category = category;

    const expenses = await Expense.find(filter)
      .populate("vehicle", "registrationNumber name")
      .sort({ date: -1 });

    return res.json(expenses);
  } catch (err) {
    return res.status(500).json({
      message: "Could not fetch expenses.",
      error: err.message,
    });
  }
};

// GET /api/expenses/meta
exports.getExpenseMeta = (req, res) => {
  return res.json({
    categories: EXPENSE_CATEGORIES,
  });
};

// POST /api/expenses
exports.createExpense = async (req, res) => {
  try {
    const {
      vehicle: vehicleId,
      trip,
      category,
      amount,
      date,
      notes,
    } = req.body;

    if (!vehicleId || amount == null) {
      return res.status(400).json({
        message: "Vehicle and amount are required.",
      });
    }

    const vehicle = await Vehicle.findById(vehicleId);

    if (!vehicle) {
      return res.status(404).json({
        message: "Vehicle not found.",
      });
    }

    const expense = await Expense.create({
      vehicle: vehicleId,
      trip: trip || undefined,
      category: category || "Other",
      amount,
      date: date || new Date(),
      notes,
    });

    const populatedExpense = await expense.populate(
      "vehicle",
      "registrationNumber name"
    );

    return res.status(201).json(populatedExpense);
  } catch (err) {
    return res.status(500).json({
      message: "Could not record expense.",
      error: err.message,
    });
  }
};

// DELETE /api/expenses/:id
exports.deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        message: "Expense not found.",
      });
    }

    await expense.deleteOne();

    return res.json({
      message: "Expense deleted.",
    });
  } catch (err) {
    return res.status(500).json({
      message: "Could not delete expense.",
      error: err.message,
    });
  }
};