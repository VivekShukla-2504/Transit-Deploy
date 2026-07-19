const express = require("express");

const auth = require("../middleware/auth");
const rbac = require("../middleware/rbac");

const driverController = require("../controllers/driver.controller");

const router = express.Router();

router.use(auth);

router.get("/", driverController.getDrivers);

router.get("/meta", driverController.getDriverMeta);

router.get("/:id", driverController.getDriverById);

router.post(
  "/",
  rbac("FleetManager", "SafetyOfficer"),
  driverController.createDriver
);

router.put(
  "/:id",
  rbac("FleetManager", "SafetyOfficer"),
  driverController.updateDriver
);

router.delete(
  "/:id",
  rbac("FleetManager"),
  driverController.deleteDriver
);

module.exports = router;