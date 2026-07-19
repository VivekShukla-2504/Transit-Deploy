const express = require("express");

const auth = require("../middleware/auth");
const rbac = require("../middleware/rbac");

const expenseController = require("../controllers/expense.controller");

const router = express.Router();

router.use(auth);

router.get("/", expenseController.getExpenses);

router.get("/meta", expenseController.getExpenseMeta);

router.post(
  "/",
  rbac("FleetManager", "Driver", "FinancialAnalyst"),
  expenseController.createExpense
);

router.delete(
  "/:id",
  rbac("FleetManager", "FinancialAnalyst"),
  expenseController.deleteExpense
);

module.exports = router;