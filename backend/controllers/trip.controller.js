const mongoose = require('mongoose');
const { Trip, TRIP_STATUSES } = require('../models/Trip');
const { Vehicle } = require('../models/Vehicle');
const { Driver } = require('../models/Driver');
const { FuelLog } = require('../models/FuelLog');

// Helper to verify driver permissions on a specific trip
async function verifyTripAccess(trip, user) {
  if (user.role !== 'Driver') return true; // FleetManager has full access
  const driverDoc = await Driver.findById(trip.driver);
  if (!driverDoc || driverDoc.email?.toLowerCase() !== user.email?.toLowerCase()) {
    return false;
  }
  return true;
}

// GET /api/trips - list with filters
exports.getTrips = async (req, res) => {
  try {
    const { status, vehicle, driver } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (vehicle) filter.vehicle = vehicle;
    if (driver) filter.driver = driver;

    // If logged-in user is a Driver, optional default to their own trips or allow filter
    const trips = await Trip.find(filter)
      .populate('vehicle', 'registrationNumber name type maxLoadCapacity status region odometer')
      .populate('driver', 'name licenseNumber status email')
      .sort({ createdAt: -1 });

    return res.json(trips);
  } catch (err) {
    return res.status(500).json({ message: 'Could not fetch trips.', error: err.message });
  }
};

// GET /api/trips/meta
exports.getTripMeta = (req, res) => {
  return res.json({ statuses: TRIP_STATUSES });
};

// GET /api/trips/:id
exports.getTripById = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id)
      .populate('vehicle')
      .populate('driver');
    if (!trip) return res.status(404).json({ message: 'Trip not found.' });
    return res.json(trip);
  } catch (err) {
    return res.status(500).json({ message: 'Could not fetch trip.', error: err.message });
  }
};

// POST /api/trips - create a Draft trip
exports.createTrip = async (req, res) => {
  try {
    const { source, destination, vehicle: vehicleId, driver: driverId, cargoWeight, plannedDistance, revenue } = req.body;

    if (!source || !destination || !vehicleId || !driverId || cargoWeight == null || plannedDistance == null) {
      return res.status(400).json({ message: 'Source, destination, vehicle, driver, cargo weight, and planned distance are all required.' });
    }

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) return res.status(404).json({ message: 'Selected vehicle was not found.' });
    const driver = await Driver.findById(driverId);
    if (!driver) return res.status(404).json({ message: 'Selected driver was not found.' });

    // Cargo weight validation against vehicle capacity
    if (cargoWeight > vehicle.maxLoadCapacity) {
      return res.status(400).json({ message: `Cargo weight (${cargoWeight}kg) exceeds ${vehicle.name}'s maximum load capacity (${vehicle.maxLoadCapacity}kg).` });
    }

    const trip = await Trip.create({
      source,
      destination,
      vehicle: vehicle._id,
      driver: driver._id,
      cargoWeight,
      plannedDistance,
      revenue: revenue || 0,
      status: 'Draft',
      createdBy: req.user.id,
    });

    const populated = await trip.populate([{ path: 'vehicle' }, { path: 'driver' }]);
    return res.status(201).json(populated);
  } catch (err) {
    return res.status(500).json({ message: 'Could not create trip.', error: err.message });
  }
};

// POST /api/trips/:id/dispatch - Draft -> Dispatched
exports.dispatchTrip = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id).populate('vehicle').populate('driver');
    if (!trip) return res.status(404).json({ message: 'Trip not found.' });
    if (trip.status !== 'Draft') {
      return res.status(400).json({ message: `Only Draft trips can be dispatched. This trip is ${trip.status}.` });
    }

    // IDOR verification: Driver role can only dispatch trips assigned to them
    const hasAccess = await verifyTripAccess(trip, req.user);
    if (!hasAccess) {
      return res.status(403).json({ message: 'You are not authorized to dispatch trips assigned to another driver.' });
    }

    const vehicle = await Vehicle.findById(trip.vehicle._id);
    const driver = await Driver.findById(trip.driver._id);

    // Vehicle status validations
    if (vehicle.status === 'Retired' || vehicle.status === 'In Shop') {
      return res.status(400).json({ message: `${vehicle.name} is ${vehicle.status} and cannot be dispatched.` });
    }
    if (vehicle.status === 'On Trip') {
      return res.status(400).json({ message: `${vehicle.name} is already on another trip.` });
    }

    // Driver dispatchability validations
    if (!driver.isDispatchable()) {
      if (driver.status !== 'Available') {
        return res.status(400).json({ message: `${driver.name} is ${driver.status.toLowerCase()} and cannot be dispatched.` });
      }
      return res.status(400).json({ message: `${driver.name}'s license has expired and cannot be dispatched.` });
    }

    // Re-verify cargo weight
    if (trip.cargoWeight > vehicle.maxLoadCapacity) {
      return res.status(400).json({ message: `Cargo weight exceeds ${vehicle.name}'s maximum load capacity.` });
    }

    vehicle.status = 'On Trip';
    driver.status = 'On Trip';
    trip.status = 'Dispatched';
    trip.dispatchedAt = new Date();

    await Promise.all([vehicle.save(), driver.save(), trip.save()]);

    const populated = await trip.populate([{ path: 'vehicle' }, { path: 'driver' }]);
    return res.json(populated);
  } catch (err) {
    return res.status(500).json({ message: 'Could not dispatch trip.', error: err.message });
  }
};

// POST /api/trips/:id/complete - Dispatched -> Completed
exports.completeTrip = async (req, res) => {
  try {
    const { finalOdometer, fuelConsumed, fuelCost } = req.body;
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ message: 'Trip not found.' });
    if (trip.status !== 'Dispatched') {
      return res.status(400).json({ message: `Only Dispatched trips can be completed. This trip is ${trip.status}.` });
    }
    if (finalOdometer == null) {
      return res.status(400).json({ message: 'Final odometer reading is required to complete a trip.' });
    }

    // IDOR verification: Driver role can only complete trips assigned to them
    const hasAccess = await verifyTripAccess(trip, req.user);
    if (!hasAccess) {
      return res.status(403).json({ message: 'You are not authorized to complete trips assigned to another driver.' });
    }

    const vehicle = await Vehicle.findById(trip.vehicle);
    const driver = await Driver.findById(trip.driver);

    if (finalOdometer < vehicle.odometer) {
      return res.status(400).json({ message: "Final odometer reading cannot be less than the vehicle's current odometer." });
    }

    trip.status = 'Completed';
    trip.completedAt = new Date();
    trip.finalOdometer = finalOdometer;
    if (fuelConsumed != null) trip.fuelConsumed = fuelConsumed;

    vehicle.odometer = finalOdometer;
    vehicle.status = 'Available';
    driver.status = 'Available';

    await Promise.all([trip.save(), vehicle.save(), driver.save()]);

    // Auto-create fuel log entry if fuel data supplied
    if (fuelConsumed != null && fuelCost != null) {
      await FuelLog.create({
        vehicle: vehicle._id,
        trip: trip._id,
        liters: fuelConsumed,
        cost: fuelCost,
        date: new Date(),
      });
    }

    const populated = await trip.populate([{ path: 'vehicle' }, { path: 'driver' }]);
    return res.json(populated);
  } catch (err) {
    return res.status(500).json({ message: 'Could not complete trip.', error: err.message });
  }
};

// POST /api/trips/:id/cancel - Draft or Dispatched -> Cancelled
exports.cancelTrip = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ message: 'Trip not found.' });
    if (!['Draft', 'Dispatched'].includes(trip.status)) {
      return res.status(400).json({ message: `Only Draft or Dispatched trips can be cancelled. This trip is ${trip.status}.` });
    }

    // IDOR verification: Driver role can only cancel trips assigned to them
    const hasAccess = await verifyTripAccess(trip, req.user);
    if (!hasAccess) {
      return res.status(403).json({ message: 'You are not authorized to cancel trips assigned to another driver.' });
    }

    const wasDispatched = trip.status === 'Dispatched';

    trip.status = 'Cancelled';
    trip.cancelledAt = new Date();
    await trip.save();

    // Cancelling a dispatched trip restores vehicle and driver to Available
    if (wasDispatched) {
      await Vehicle.findByIdAndUpdate(trip.vehicle, { status: 'Available' });
      await Driver.findByIdAndUpdate(trip.driver, { status: 'Available' });
    }

    const populated = await trip.populate([{ path: 'vehicle' }, { path: 'driver' }]);
    return res.json(populated);
  } catch (err) {
    return res.status(500).json({ message: 'Could not cancel trip.', error: err.message });
  }
};

