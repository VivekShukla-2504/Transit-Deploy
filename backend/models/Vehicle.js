const mongoose = require('mongoose');

const VEHICLE_STATUSES = ['Available', 'On Trip', 'In Shop', 'Retired'];
const VEHICLE_TYPES = ['Van', 'Truck', 'Mini Truck', 'Trailer', 'Bike'];

const vehicleSchema = new mongoose.Schema(
  {
    registrationNumber: { type: String, required: true, unique: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true }, // model/name
    type: { type: String, enum: VEHICLE_TYPES, required: true },
    maxLoadCapacity: { type: Number, required: true, min: 0 }, // kg
    odometer: { type: Number, required: true, default: 0, min: 0 }, // km
    acquisitionCost: { type: Number, required: true, min: 0 },
    status: { type: String, enum: VEHICLE_STATUSES, default: 'Available' },
    region: { type: String, trim: true, default: 'Unassigned' },
  },
  { timestamps: true }
);

module.exports = { Vehicle: mongoose.model('Vehicle', vehicleSchema), VEHICLE_STATUSES, VEHICLE_TYPES };
