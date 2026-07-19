const { Maintenance } = require("../models/Maintenance");
const { Vehicle } = require("../models/Vehicle");

// GET /api/maintenance
exports.getMaintenanceLogs = async (req, res) => {
  try {
    const { vehicle, status } = req.query;

    const filter = {};

    if (vehicle) filter.vehicle = vehicle;
    if (status) filter.status = status;

    const logs = await Maintenance.find(filter)
      .populate("vehicle", "registrationNumber name type status")
      .sort({ createdAt: -1 });

    return res.json(logs);
  } catch (err) {
    return res.status(500).json({
      message: "Could not fetch maintenance logs.",
      error: err.message,
    });
  }
};

// GET /api/maintenance/:id
exports.getMaintenanceById = async (req, res) => {
  try {
    const log = await Maintenance.findById(req.params.id).populate("vehicle");

    if (!log) {
      return res.status(404).json({
        message: "Maintenance record not found.",
      });
    }

    return res.json(log);
  } catch (err) {
    return res.status(500).json({
      message: "Could not fetch maintenance record.",
      error: err.message,
    });
  }
};

// POST /api/maintenance
exports.createMaintenance = async (req, res) => {
  try {
    const {
      vehicle: vehicleId,
      type,
      description,
      cost,
    } = req.body;

    if (!vehicleId || !type) {
      return res.status(400).json({
        message: "Vehicle and maintenance type are required.",
      });
    }

    const vehicle = await Vehicle.findById(vehicleId);

    if (!vehicle) {
      return res.status(404).json({
        message: "Vehicle not found.",
      });
    }

    if (vehicle.status === "On Trip") {
      return res.status(400).json({
        message: `${vehicle.name} is currently on a trip and cannot be sent to maintenance.`,
      });
    }

    const maintenance = await Maintenance.create({
      vehicle: vehicle._id,
      type,
      description,
      cost: cost || 0,
      status: "Open",
      openedAt: new Date(),
    });

    vehicle.status = "In Shop";
    await vehicle.save();

    const populatedMaintenance = await maintenance.populate("vehicle");

    return res.status(201).json(populatedMaintenance);
  } catch (err) {
    return res.status(500).json({
      message: "Could not create maintenance record.",
      error: err.message,
    });
  }
};

// POST /api/maintenance/:id/close
exports.closeMaintenance = async (req, res) => {
  try {
    const { cost, retireVehicle } = req.body;

    const maintenance = await Maintenance.findById(req.params.id);

    if (!maintenance) {
      return res.status(404).json({
        message: "Maintenance record not found.",
      });
    }

    if (maintenance.status === "Closed") {
      return res.status(400).json({
        message: "This maintenance record is already closed.",
      });
    }

    maintenance.status = "Closed";
    maintenance.closedAt = new Date();

    if (cost != null) maintenance.cost = cost;
    if (retireVehicle) maintenance.markVehicleRetired = true;

    await maintenance.save();

    const vehicle = await Vehicle.findById(maintenance.vehicle);

    if (vehicle) {
      vehicle.status = retireVehicle
        ? "Retired"
        : "Available";

      await vehicle.save();
    }

    const populatedMaintenance = await maintenance.populate("vehicle");

    return res.json(populatedMaintenance);
  } catch (err) {
    return res.status(500).json({
      message: "Could not close maintenance record.",
      error: err.message,
    });
  }
};

// PUT /api/maintenance/:id
exports.updateMaintenance = async (req, res) => {
  try {
    const maintenance = await Maintenance.findById(req.params.id);

    if (!maintenance) {
      return res.status(404).json({
        message: "Maintenance record not found.",
      });
    }

    const {
      type,
      description,
      cost,
    } = req.body;

    if (type != null) maintenance.type = type;
    if (description != null) maintenance.description = description;
    if (cost != null) maintenance.cost = cost;

    await maintenance.save();

    const populatedMaintenance = await maintenance.populate("vehicle");

    return res.json(populatedMaintenance);
  } catch (err) {
    return res.status(500).json({
      message: "Could not update maintenance record.",
      error: err.message,
    });
  }
};