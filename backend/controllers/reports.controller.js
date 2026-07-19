const { Vehicle } = require("../models/Vehicle");
const { Trip } = require("../models/Trip");
const { Maintenance } = require("../models/Maintenance");
const { FuelLog } = require("../models/FuelLog");
const { Expense } = require("../models/Expense");

// Internal Helper
async function buildVehicleReport() {
  const vehicles = await Vehicle.find({});
  const report = [];

  for (const vehicle of vehicles) {
    const completedTrips = await Trip.find({
      vehicle: vehicle._id,
      status: "Completed",
    });

    const fuelLogs = await FuelLog.find({
      vehicle: vehicle._id,
    });

    const maintenanceLogs = await Maintenance.find({
      vehicle: vehicle._id,
    });

    const expenses = await Expense.find({
      vehicle: vehicle._id,
    });

    const totalDistance = completedTrips.reduce(
      (sum, trip) => sum + (trip.plannedDistance || 0),
      0
    );

    const totalFuelLiters = fuelLogs.reduce(
      (sum, log) => sum + (log.liters || 0),
      0
    );

    const totalFuelCost = fuelLogs.reduce(
      (sum, log) => sum + (log.cost || 0),
      0
    );

    const totalMaintenanceCost = maintenanceLogs.reduce(
      (sum, maintenance) => sum + (maintenance.cost || 0),
      0
    );

    const totalExpenses = expenses.reduce(
      (sum, expense) => sum + (expense.amount || 0),
      0
    );

    const totalRevenue = completedTrips.reduce(
      (sum, trip) => sum + (trip.revenue || 0),
      0
    );

    const fuelEfficiency =
      totalFuelLiters > 0
        ? Math.round((totalDistance / totalFuelLiters) * 100) / 100
        : 0;

    const operationalCost =
      totalFuelCost + totalMaintenanceCost;

    const roi =
      vehicle.acquisitionCost > 0
        ? Math.round(
            ((totalRevenue - operationalCost) /
              vehicle.acquisitionCost) *
              1000
          ) / 1000
        : 0;

    report.push({
      vehicleId: vehicle._id,
      registrationNumber: vehicle.registrationNumber,
      name: vehicle.name,
      type: vehicle.type,
      status: vehicle.status,
      totalTrips: completedTrips.length,
      totalDistanceKm: totalDistance,
      totalFuelLiters,
      totalFuelCost,
      totalMaintenanceCost,
      totalExpenses,
      totalRevenue,
      operationalCost,
      fuelEfficiencyKmPerLiter: fuelEfficiency,
      roi,
    });
  }

  return report;
}

// GET /api/reports/vehicles
exports.getVehicleReport = async (req, res) => {
  try {
    const report = await buildVehicleReport();

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
    const report = await buildVehicleReport();

    const headers = [
      "Registration Number",
      "Name",
      "Type",
      "Status",
      "Total Trips",
      "Total Distance (km)",
      "Total Fuel (L)",
      "Fuel Cost",
      "Maintenance Cost",
      "Other Expenses",
      "Revenue",
      "Operational Cost",
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

    const escapeCsv = (value) => {
      const str = String(value ?? "");

      if (
        str.includes(",") ||
        str.includes('"') ||
        str.includes("\n")
      ) {
        return `"${str.replace(/"/g, '""')}"`;
      }

      return str;
    };

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\n");

    res.setHeader("Content-Type", "text/csv");
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