const { Vehicle } = require("../models/Vehicle");
const { Trip } = require("../models/Trip");
const { Driver } = require("../models/Driver");
const { Maintenance } = require("../models/Maintenance");
const { FuelLog } = require("../models/FuelLog");
const { Expense } = require("../models/Expense");

// Helper for escaping CSV fields safely
function escapeCsv(value) {
  const str = String(value ?? "");
  if (
    str.includes(",") ||
    str.includes('"') ||
    str.includes("\n") ||
    str.includes("\r")
  ) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// Internal Helper - Batched parallel queries for high performance with optional date filtering
async function buildVehicleReport(options = {}) {
  const { startDate, endDate } = options;
  const dateFilter = {};

  if (startDate) {
    const sDate = new Date(startDate);
    if (!isNaN(sDate.getTime())) dateFilter.$gte = sDate;
  }
  if (endDate) {
    const eDate = new Date(endDate);
    if (!isNaN(eDate.getTime())) {
      eDate.setHours(23, 59, 59, 999);
      dateFilter.$lte = eDate;
    }
  }

  const hasDateFilter = Object.keys(dateFilter).length > 0;
  const tripQuery = { status: "Completed" };
  const fuelQuery = {};
  const maintQuery = {};
  const expQuery = {};

  if (hasDateFilter) {
    tripQuery.completedAt = dateFilter;
    fuelQuery.date = dateFilter;
    maintQuery.createdAt = dateFilter;
    expQuery.date = dateFilter;
  }

  const [vehicles, completedTrips, fuelLogs, maintenanceLogs, expenses] = await Promise.all([
    Vehicle.find({}).lean(),
    Trip.find(tripQuery).lean(),
    FuelLog.find(fuelQuery).lean(),
    Maintenance.find(maintQuery).lean(),
    Expense.find(expQuery).lean(),
  ]);

  // Group by vehicle ID for O(1) in-memory lookup
  const tripsByVehicle = new Map();
  for (const trip of completedTrips) {
    const key = trip.vehicle?.toString();
    if (!key) continue;
    if (!tripsByVehicle.has(key)) tripsByVehicle.set(key, []);
    tripsByVehicle.get(key).push(trip);
  }

  const fuelByVehicle = new Map();
  for (const log of fuelLogs) {
    const key = log.vehicle?.toString();
    if (!key) continue;
    if (!fuelByVehicle.has(key)) fuelByVehicle.set(key, []);
    fuelByVehicle.get(key).push(log);
  }

  const maintenanceByVehicle = new Map();
  for (const log of maintenanceLogs) {
    const key = log.vehicle?.toString();
    if (!key) continue;
    if (!maintenanceByVehicle.has(key)) maintenanceByVehicle.set(key, []);
    maintenanceByVehicle.get(key).push(log);
  }

  const expensesByVehicle = new Map();
  for (const exp of expenses) {
    const key = exp.vehicle?.toString();
    if (!key) continue;
    if (!expensesByVehicle.has(key)) expensesByVehicle.set(key, []);
    expensesByVehicle.get(key).push(exp);
  }

  return vehicles.map((vehicle) => {
    const vId = vehicle._id.toString();
    const vTrips = tripsByVehicle.get(vId) || [];
    const vFuel = fuelByVehicle.get(vId) || [];
    const vMaintenance = maintenanceByVehicle.get(vId) || [];
    const vExpenses = expensesByVehicle.get(vId) || [];

    const totalDistance = vTrips.reduce(
      (sum, trip) => sum + (trip.plannedDistance || 0),
      0
    );

    const totalFuelLiters = vFuel.reduce(
      (sum, log) => sum + (log.liters || 0),
      0
    );

    const totalFuelCost = vFuel.reduce(
      (sum, log) => sum + (log.cost || 0),
      0
    );

    const totalMaintenanceCost = vMaintenance.reduce(
      (sum, maintenance) => sum + (maintenance.cost || 0),
      0
    );

    const totalExpenses = vExpenses.reduce(
      (sum, expense) => sum + (expense.amount || 0),
      0
    );

    const totalRevenue = vTrips.reduce(
      (sum, trip) => sum + (trip.revenue || 0),
      0
    );

    const fuelEfficiency =
      totalFuelLiters > 0
        ? Math.round((totalDistance / totalFuelLiters) * 100) / 100
        : 0;

    const operationalCost = totalFuelCost + totalMaintenanceCost;

    const roi =
      vehicle.acquisitionCost > 0
        ? Math.round(
            ((totalRevenue - operationalCost) / vehicle.acquisitionCost) * 1000
          ) / 1000
        : 0;

    return {
      vehicleId: vehicle._id,
      registrationNumber: vehicle.registrationNumber,
      name: vehicle.name,
      type: vehicle.type,
      status: vehicle.status,
      totalTrips: vTrips.length,
      totalDistanceKm: totalDistance,
      totalFuelLiters,
      totalFuelCost,
      totalMaintenanceCost,
      totalExpenses,
      totalRevenue,
      operationalCost,
      fuelEfficiencyKmPerLiter: fuelEfficiency,
      roi,
    };
  });
}

// GET /api/reports/vehicles
exports.getVehicleReport = async (req, res) => {
  try {
    const report = await buildVehicleReport(req.query);
    return res.json(report);
  } catch (err) {
    return res.status(500).json({
      message: "Could not build vehicle report.",
      error: err.message,
    });
  }
};

// GET /api/reports/fleet-utilization
exports.getFleetUtilization = async (req, res) => {
  try {
    const vehicles = await Vehicle.find({});

    const activeVehicles = vehicles.filter(
      (vehicle) => vehicle.status !== "Retired"
    ).length;

    const onTripVehicles = vehicles.filter(
      (vehicle) => vehicle.status === "On Trip"
    ).length;

    const fleetUtilization =
      activeVehicles > 0
        ? Math.round((onTripVehicles / activeVehicles) * 1000) / 10
        : 0;

    return res.json({
      activeVehicles,
      onTripVehicles,
      fleetUtilizationPercent: fleetUtilization,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Could not compute fleet utilization.",
      error: err.message,
    });
  }
};

// GET /api/reports/export.csv
exports.exportVehicleReport = async (req, res) => {
  try {
    const report = await buildVehicleReport(req.query);

    const headers = [
      "Registration Number",
      "Name",
      "Type",
      "Status",
      "Total Trips",
      "Total Distance (km)",
      "Total Fuel (L)",
      "Fuel Cost (INR)",
      "Maintenance Cost (INR)",
      "Other Expenses (INR)",
      "Revenue (INR)",
      "Operational Cost (INR)",
      "Fuel Efficiency (km/L)",
      "ROI",
    ];

    const rows = report.map((row) => [
      row.registrationNumber,
      row.name,
      row.type,
      row.status,
      row.totalTrips,
      row.totalDistanceKm,
      row.totalFuelLiters,
      row.totalFuelCost,
      row.totalMaintenanceCost,
      row.totalExpenses,
      row.totalRevenue,
      row.operationalCost,
      row.fuelEfficiencyKmPerLiter,
      row.roi,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="transitops-vehicle-report.csv"'
    );

    return res.send(csv);
  } catch (err) {
    return res.status(500).json({
      message: "Could not export report.",
      error: err.message,
    });
  }
};

// GET /api/reports/trips/export.csv
exports.exportTripsReport = async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    const filter = {};

    if (status) filter.status = status;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        const sDate = new Date(startDate);
        if (!isNaN(sDate.getTime())) filter.createdAt.$gte = sDate;
      }
      if (endDate) {
        const eDate = new Date(endDate);
        if (!isNaN(eDate.getTime())) {
          eDate.setHours(23, 59, 59, 999);
          filter.createdAt.$lte = eDate;
        }
      }
      if (Object.keys(filter.createdAt).length === 0) delete filter.createdAt;
    }

    const trips = await Trip.find(filter)
      .populate("vehicle", "registrationNumber name type")
      .populate("driver", "name licenseNumber contactNumber")
      .sort({ createdAt: -1 })
      .lean();

    const headers = [
      "Trip ID",
      "Source",
      "Destination",
      "Status",
      "Vehicle Reg #",
      "Vehicle Name",
      "Vehicle Type",
      "Driver Name",
      "Driver License",
      "Cargo Weight (kg)",
      "Planned Distance (km)",
      "Revenue (INR)",
      "Fuel Consumed (L)",
      "Created Date",
      "Dispatched Date",
      "Completed Date",
    ];

    const rows = trips.map((trip) => [
      trip._id.toString(),
      trip.source,
      trip.destination,
      trip.status,
      trip.vehicle?.registrationNumber || "N/A",
      trip.vehicle?.name || "N/A",
      trip.vehicle?.type || "N/A",
      trip.driver?.name || "N/A",
      trip.driver?.licenseNumber || "N/A",
      trip.cargoWeight ?? 0,
      trip.plannedDistance ?? 0,
      trip.revenue ?? 0,
      trip.fuelConsumed ?? 0,
      trip.createdAt ? new Date(trip.createdAt).toISOString().slice(0, 10) : "",
      trip.dispatchedAt ? new Date(trip.dispatchedAt).toISOString().slice(0, 10) : "",
      trip.completedAt ? new Date(trip.completedAt).toISOString().slice(0, 10) : "",
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="transitops-trips-report.csv"'
    );

    return res.send(csv);
  } catch (err) {
    return res.status(500).json({
      message: "Could not export trips report.",
      error: err.message,
    });
  }
};

// GET /api/reports/drivers/export.csv
exports.exportDriversReport = async (req, res) => {
  try {
    const [drivers, trips] = await Promise.all([
      Driver.find({}).lean(),
      Trip.find({ status: "Completed" }).lean(),
    ]);

    const driverTripCount = new Map();
    for (const trip of trips) {
      const dId = trip.driver?.toString();
      if (!dId) continue;
      driverTripCount.set(dId, (driverTripCount.get(dId) || 0) + 1);
    }

    const headers = [
      "Driver Name",
      "Email",
      "Contact Number",
      "License Number",
      "License Category",
      "License Expiry Date",
      "License Status",
      "Safety Score",
      "Status",
      "Completed Trips",
    ];

    const now = new Date();
    const rows = drivers.map((driver) => {
      const isExpired = driver.licenseExpiryDate
        ? new Date(driver.licenseExpiryDate) < now
        : false;

      return [
        driver.name,
        driver.email || "",
        driver.contactNumber || "",
        driver.licenseNumber,
        driver.licenseCategory,
        driver.licenseExpiryDate
          ? new Date(driver.licenseExpiryDate).toISOString().slice(0, 10)
          : "",
        isExpired ? "EXPIRED" : "VALID",
        driver.safetyScore ?? 100,
        driver.status,
        driverTripCount.get(driver._id.toString()) || 0,
      ];
    });

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="transitops-drivers-report.csv"'
    );

    return res.send(csv);
  } catch (err) {
    return res.status(500).json({
      message: "Could not export drivers report.",
      error: err.message,
    });
  }
};