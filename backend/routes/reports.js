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

router.get(
  "/trips/export.csv",
  reportsController.exportTripsReport
);

router.get(
  "/drivers/export.csv",
  reportsController.exportDriversReport
);

module.exports = router;