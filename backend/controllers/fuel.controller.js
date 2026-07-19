const { FuelLog } = require("../models/FuelLog");
const { Vehicle } = require("../models/Vehicle");

// GET /api/fuel
exports.getFuelLogs = async (req, res) => {
  try {
    const { vehicle } = req.query;

    const filter = {};

    if (vehicle) {
      filter.vehicle = vehicle;
    }

    const logs = await FuelLog.find(filter)
      .populate("vehicle", "registrationNumber name")
      .sort({ date: -1 });

    return res.json(logs);
  } catch (err) {
    return res.status(500).json({
      message: "Could not fetch fuel logs.",
      error: err.message,
    });
  }
};

// POST /api/fuel
exports.createFuelLog = async (req, res) => {
  try {
    const {
      vehicle: vehicleId,
      trip,
      liters,
      cost,
      date,
    } = req.body;

    if (!vehicleId || liters == null || cost == null) {
      return res.status(400).json({
        message: "Vehicle, liters, and cost are required.",
      });
    }

    const vehicle = await Vehicle.findById(vehicleId);

    if (!vehicle) {
      return res.status(404).json({
        message: "Vehicle not found.",
      });
    }

    const fuelLog = await FuelLog.create({
      vehicle: vehicleId,
      trip: trip || undefined,
      liters,
      cost,
      date: date || new Date(),
    });

    const populatedFuelLog = await fuelLog.populate(
      "vehicle",
      "registrationNumber name"
    );

    return res.status(201).json(populatedFuelLog);
  } catch (err) {
    return res.status(500).json({
      message: "Could not record fuel log.",
      error: err.message,
    });
  }
};

// DELETE /api/fuel/:id
exports.deleteFuelLog = async (req, res) => {
  try {
    const fuelLog = await FuelLog.findById(req.params.id);

    if (!fuelLog) {
      return res.status(404).json({
        message: "Fuel log not found.",
      });
    }

    await fuelLog.deleteOne();

    return res.json({
      message: "Fuel log deleted.",
    });
  } catch (err) {
    return res.status(500).json({
      message: "Could not delete fuel log.",
      error: err.message,
    });
  }
};