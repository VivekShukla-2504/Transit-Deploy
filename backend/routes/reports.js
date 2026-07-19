const express = require("express");
const auth = require("../middleware/auth");

const reportsController = require("../controllers/reports.controller");

const router = express.Router();

router.use(auth);

router.get(
  "/vehicles",
  reportsController.getVehicleReport
);

router.get(
  "/fleet-utilization",
  reportsController.getFleetUtilization
);

router.get(
  "/export.csv",
  reportsController.exportVehicleReport
);

module.exports = router;