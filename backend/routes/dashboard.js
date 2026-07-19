const express = require("express");
const auth = require("../middleware/auth");

const dashboardController = require("../controllers/dashboard.controller");

console.log(dashboardController);

const router = express.Router();

router.use(auth);

// sirf ek route

router.get("/kpis", dashboardController.getKPIs);
router.get("/filters", dashboardController.getFilters);
router.get("/recent-trips", dashboardController.getRecentTrips);
router.get(
  "/vehicle-status",
  dashboardController.getVehicleStatus
);
module.exports = router;

// const dashboardController = require("../controllers/dashboard.controller");

console.log(dashboardController);
// router.get("/kpis", dashboardController.getKPIs);

// router.get("/filters", dashboardController.getFilters);

// // For recent trips
// const {
//   getKPIs,
//   getFilters,
//   getRecentTrips,
// } = require("../controllers/dashboard.controller");

// router.get("/recent-trips", getRecentTrips);
// module.exports = router;