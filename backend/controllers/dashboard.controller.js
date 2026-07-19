const { Vehicle } = require("../models/Vehicle");
const { Driver } = require("../models/Driver");
const { Trip } = require("../models/Trip");

console.log("Dashboard Controller Loaded");
console.log(exports);




// get api for vehicle status 
// GET /api/dashboard/vehicle-status
exports.getVehicleStatus = async (req, res) => {
  try {
    const total = await Vehicle.countDocuments();

    const available = await Vehicle.countDocuments({
      status: "Available",
    });

    const onTrip = await Vehicle.countDocuments({
      status: "On Trip",
    });

    const inShop = await Vehicle.countDocuments({
      status: "In Shop",
    });

    const retired = await Vehicle.countDocuments({
      status: "Retired",
    });

    res.json({
      total,
      available,
      onTrip,
      inShop,
      retired,
    });
  } catch (err) {
    res.status(500).json({
      message: "Could not fetch vehicle status.",
      error: err.message,
    });
  }
};




// GET /api/dashboard/recent-trips
exports.getRecentTrips = async (req, res) => {
  try {
    const trips = await Trip.find()
      .populate("vehicle", "registrationNumber name")
      .populate("driver", "name")
      .sort({ createdAt: -1 })
      .limit(5);

    return res.json(trips);
  } catch (err) {
    return res.status(500).json({
      message: "Could not fetch recent trips.",
      error: err.message,
    });
  }
};

// GET /api/dashboard/kpis
exports.getKPIs = async (req, res) => {
  try {
    const { type, region } = req.query;

    const vehicleFilter = {};

    if (type) vehicleFilter.type = type;
    if (region) vehicleFilter.region = region;

    const vehicles = await Vehicle.find(vehicleFilter);

    const vehicleIds = vehicles.map((vehicle) => vehicle._id);

    const activeVehicles = vehicles.filter(
      (vehicle) => vehicle.status !== "Retired"
    ).length;

    const availableVehicles = vehicles.filter(
      (vehicle) => vehicle.status === "Available"
    ).length;

    const vehiclesInMaintenance = vehicles.filter(
      (vehicle) => vehicle.status === "In Shop"
    ).length;

    const onTripVehicles = vehicles.filter(
      (vehicle) => vehicle.status === "On Trip"
    ).length;

    const activeTrips = await Trip.countDocuments({
      status: "Dispatched",
      vehicle: { $in: vehicleIds },
    });

    const pendingTrips = await Trip.countDocuments({
      status: "Draft",
      vehicle: { $in: vehicleIds },
    });

    const drivers = await Driver.find({});

    const driversOnDuty = drivers.filter(
      (driver) =>
        driver.status === "Available" ||
        driver.status === "On Trip"
    ).length;

    const fleetUtilization =
      activeVehicles > 0
        ? Math.round((onTripVehicles / activeVehicles) * 1000) / 10
        : 0;

    return res.json({
      activeVehicles,
      availableVehicles,
      vehiclesInMaintenance,
      activeTrips,
      pendingTrips,
      driversOnDuty,
      fleetUtilization,
      totalDrivers: drivers.length,
      totalVehicles: vehicles.length,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Could not compute dashboard KPIs.",
      error: err.message,
    });
  }
};

// GET /api/dashboard/filters
exports.getFilters = async (req, res) => {
  try {
    const types = await Vehicle.distinct("type");

    const regions = await Vehicle.distinct("region");

    const statuses = await Vehicle.distinct("status");

    return res.json({
      types,
      regions,
      statuses,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Could not fetch filters.",
      error: err.message,
    });
  }
};

console.log("Dashboard Controller Loaded");
console.log(exports);