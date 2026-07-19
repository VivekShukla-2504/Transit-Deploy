const express = require("express");

const auth = require("../middleware/auth");
const rbac = require("../middleware/rbac");

const maintenanceController = require("../controllers/maintenance.controller");

const router = express.Router();

router.use(auth);

router.get("/", maintenanceController.getMaintenanceLogs);

router.get("/:id", maintenanceController.getMaintenanceById);

router.post(
  "/",
  rbac("FleetManager"),
  maintenanceController.createMaintenance
);

router.post(
  "/:id/close",
  rbac("FleetManager"),
  maintenanceController.closeMaintenance
);

router.put(
  "/:id",
  rbac("FleetManager"),
  maintenanceController.updateMaintenance
);

module.exports = router;