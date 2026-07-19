const express = require("express");

const auth = require("../middleware/auth");
const rbac = require("../middleware/rbac");

const fuelController = require("../controllers/fuel.controller");

const router = express.Router();

router.use(auth);

router.get("/", fuelController.getFuelLogs);

router.post(
  "/",
  rbac("FleetManager", "Driver"),
  fuelController.createFuelLog
);

router.delete(
  "/:id",
  rbac("FleetManager"),
  fuelController.deleteFuelLog
);

module.exports = router;