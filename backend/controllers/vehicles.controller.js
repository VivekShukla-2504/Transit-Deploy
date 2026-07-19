const {
  Vehicle,
  VEHICLE_STATUSES,
  VEHICLE_TYPES,
} = require("../models/Vehicle");

// GET /api/vehicles
exports.getVehicles = async (req, res) => {
  try {
    const { type, status, region, availableForDispatch } = req.query;

    const filter = {};

    if (type) filter.type = type;
    if (status) filter.status = status;
    if (region) filter.region = region;

    if (availableForDispatch === "true") {
      filter.status = "Available";
    }

    const vehicles = await Vehicle.find(filter).sort({
      createdAt: -1,
    });

    return res.json(vehicles);
  } catch (err) {
    return res.status(500).json({
      message: "Could not fetch vehicles.",
      error: err.message,
    });
  }
};

// GET /api/vehicles/meta
exports.getVehicleMeta = (req, res) => {
  return res.json({
    statuses: VEHICLE_STATUSES,
    types: VEHICLE_TYPES,
  });
};

// GET /api/vehicles/:id
exports.getVehicleById = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        message: "Vehicle not found.",
      });
    }

    return res.json(vehicle);
  } catch (err) {
    return res.status(500).json({
      message: "Could not fetch vehicle.",
      error: err.message,
    });
  }
};

// POST /api/vehicles
exports.createVehicle = async (req, res) => {
  try {
    const {
      registrationNumber,
      name,
      type,
      maxLoadCapacity,
      odometer,
      acquisitionCost,
      region,
    } = req.body;

    if (
      !registrationNumber ||
      !name ||
      !type ||
      maxLoadCapacity == null ||
      acquisitionCost == null
    ) {
      return res.status(400).json({
        message:
          "Registration number, name, type, max load capacity, and acquisition cost are required.",
      });
    }

    const existing = await Vehicle.findOne({
      registrationNumber: registrationNumber.toUpperCase(),
    });

    if (existing) {
      return res.status(409).json({
        message:
          "A vehicle with this registration number already exists.",
      });
    }

    const vehicle = await Vehicle.create({
      registrationNumber,
      name,
      type,
      maxLoadCapacity,
      odometer: odometer || 0,
      acquisitionCost,
      region,
    });

    return res.status(201).json(vehicle);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        message:
          "A vehicle with this registration number already exists.",
      });
    }

    return res.status(500).json({
      message: "Could not register vehicle.",
      error: err.message,
    });
  }
};

// PUT /api/vehicles/:id
exports.updateVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        message: "Vehicle not found.",
      });
    }

    const {
      registrationNumber,
      name,
      type,
      maxLoadCapacity,
      odometer,
      acquisitionCost,
      status,
      region,
    } = req.body;

    if (
      registrationNumber &&
      registrationNumber.toUpperCase() !==
        vehicle.registrationNumber
    ) {
      const duplicate = await Vehicle.findOne({
        registrationNumber:
          registrationNumber.toUpperCase(),
      });

      if (duplicate) {
        return res.status(409).json({
          message:
            "A vehicle with this registration number already exists.",
        });
      }

      vehicle.registrationNumber = registrationNumber;
    }

    if (name != null) vehicle.name = name;
    if (type != null) vehicle.type = type;
    if (maxLoadCapacity != null)
      vehicle.maxLoadCapacity = maxLoadCapacity;
    if (odometer != null) vehicle.odometer = odometer;
    if (acquisitionCost != null)
      vehicle.acquisitionCost = acquisitionCost;
    if (region != null) vehicle.region = region;

    if (status != null) {
      if (
        vehicle.status === "On Trip" &&
        status !== "On Trip"
      ) {
        return res.status(400).json({
          message:
            "Vehicle is currently on a trip. Complete or cancel the trip before changing its status manually.",
        });
      }

      vehicle.status = status;
    }

    await vehicle.save();

    return res.json(vehicle);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        message:
          "A vehicle with this registration number already exists.",
      });
    }

    return res.status(500).json({
      message: "Could not update vehicle.",
      error: err.message,
    });
  }
};

// DELETE /api/vehicles/:id
exports.deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        message: "Vehicle not found.",
      });
    }

    if (vehicle.status === "On Trip") {
      return res.status(400).json({
        message:
          "Cannot delete a vehicle that is currently on a trip.",
      });
    }

    await vehicle.deleteOne();

    return res.json({
      message: "Vehicle deleted.",
    });
  } catch (err) {
    return res.status(500).json({
      message: "Could not delete vehicle.",
      error: err.message,
    });
  }
};