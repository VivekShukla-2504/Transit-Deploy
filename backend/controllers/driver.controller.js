const { Driver, DRIVER_STATUSES } = require("../models/Driver");

// GET /api/drivers
exports.getDrivers = async (req, res) => {
  try {
    const { status, availableForDispatch } = req.query;

    const filter = {};

    if (status) filter.status = status;

    let drivers = await Driver.find(filter).sort({ createdAt: -1 });

    if (availableForDispatch === "true") {
      const now = new Date();

      drivers = drivers.filter(
        (driver) =>
          driver.status === "Available" &&
          driver.licenseExpiryDate >= now
      );
    }

    return res.json(drivers);
  } catch (err) {
    return res.status(500).json({
      message: "Could not fetch drivers.",
      error: err.message,
    });
  }
};

// GET /api/drivers/meta
exports.getDriverMeta = (req, res) => {
  return res.json({
    statuses: DRIVER_STATUSES,
  });
};

// GET /api/drivers/:id
exports.getDriverById = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);

    if (!driver) {
      return res.status(404).json({
        message: "Driver not found.",
      });
    }

    return res.json(driver);
  } catch (err) {
    return res.status(500).json({
      message: "Could not fetch driver.",
      error: err.message,
    });
  }
};

// POST /api/drivers
exports.createDriver = async (req, res) => {
  try {
    const {
      name,
      email,
      licenseNumber,
      licenseCategory,
      licenseExpiryDate,
      contactNumber,
      safetyScore,
    } = req.body;

    if (
      !name ||
      !email ||
      !licenseNumber ||
      !licenseCategory ||
      !licenseExpiryDate ||
      !contactNumber
    ) {
      return res.status(400).json({
        message:
          "Name, email, license number, license category, license expiry date, and contact number are required.",
      });
    }

    const existing = await Driver.findOne({
      licenseNumber: licenseNumber.toUpperCase(),
    });

    if (existing) {
      return res.status(409).json({
        message: "A driver with this license number already exists.",
      });
    }

    const driver = await Driver.create({
      name,
      email,
      licenseNumber,
      licenseCategory,
      licenseExpiryDate,
      contactNumber,
      safetyScore: safetyScore != null ? safetyScore : 100,
    });

    return res.status(201).json(driver);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        message: "A driver with this license number already exists.",
      });
    }

    return res.status(500).json({
      message: "Could not register driver.",
      error: err.message,
    });
  }
};

// PUT /api/drivers/:id
exports.updateDriver = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);

    if (!driver) {
      return res.status(404).json({
        message: "Driver not found.",
      });
    }

    const {
      name,
      email,
      licenseNumber,
      licenseCategory,
      licenseExpiryDate,
      contactNumber,
      safetyScore,
      status,
    } = req.body;

    if (
      licenseNumber &&
      licenseNumber.toUpperCase() !== driver.licenseNumber
    ) {
      const duplicate = await Driver.findOne({
        licenseNumber: licenseNumber.toUpperCase(),
      });

      if (duplicate) {
        return res.status(409).json({
          message: "A driver with this license number already exists.",
        });
      }

      driver.licenseNumber = licenseNumber;
    }

    if (name != null) driver.name = name;
    if (email != null) driver.email = email;
    if (licenseCategory != null) driver.licenseCategory = licenseCategory;
    if (licenseExpiryDate != null)
      driver.licenseExpiryDate = licenseExpiryDate;
    if (contactNumber != null) driver.contactNumber = contactNumber;
    if (safetyScore != null) driver.safetyScore = safetyScore;

    if (status != null) {
      if (
        driver.status === "On Trip" &&
        status !== "On Trip"
      ) {
        return res.status(400).json({
          message:
            "Driver is currently on a trip. Complete or cancel the trip before changing status manually.",
        });
      }

      driver.status = status;
    }

    await driver.save();

    return res.json(driver);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        message: "A driver with this license number already exists.",
      });
    }

    return res.status(500).json({
      message: "Could not update driver.",
      error: err.message,
    });
  }
};

// DELETE /api/drivers/:id
exports.deleteDriver = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);

    if (!driver) {
      return res.status(404).json({
        message: "Driver not found.",
      });
    }

    if (driver.status === "On Trip") {
      return res.status(400).json({
        message:
          "Cannot delete a driver that is currently on a trip.",
      });
    }

    await driver.deleteOne();

    return res.json({
      message: "Driver deleted.",
    });
  } catch (err) {
    return res.status(500).json({
      message: "Could not delete driver.",
      error: err.message,
    });
  }
};