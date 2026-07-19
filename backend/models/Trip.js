const mongoose = require('mongoose');

const TRIP_STATUSES = ['Draft', 'Dispatched', 'Completed', 'Cancelled'];

const tripSchema = new mongoose.Schema(
  {
    source: { type: String, required: true, trim: true },
    destination: { type: String, required: true, trim: true },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },
    cargoWeight: { type: Number, required: true, min: 0 },
    plannedDistance: { type: Number, required: true, min: 0 }, // km
    status: { type: String, enum: TRIP_STATUSES, default: 'Draft' },
    dispatchedAt: { type: Date },
    completedAt: { type: Date },
    cancelledAt: { type: Date },
    finalOdometer: { type: Number, min: 0 },
    fuelConsumed: { type: Number, min: 0 }, // liters, entered on completion
    revenue: { type: Number, min: 0, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = { Trip: mongoose.model('Trip', tripSchema), TRIP_STATUSES };
