const express = require("express");

const auth = require("../middleware/auth");
const rbac = require("../middleware/rbac");

const vehiclesController = require("../controllers/vehicles.controller");

const router = express.Router();

router.use(auth);

router.get("/", vehiclesController.getVehicles);

router.get("/meta", vehiclesController.getVehicleMeta);

router.get("/:id", vehiclesController.getVehicleById);

router.post(
  "/",
  rbac("FleetManager"),
  vehiclesController.createVehicle
);

router.put(
  "/:id",
  rbac("FleetManager"),
  vehiclesController.updateVehicle
);

router.delete(
  "/:id",
  rbac("FleetManager"),
  vehiclesController.deleteVehicle
);

module.exports = router;