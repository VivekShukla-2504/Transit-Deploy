const mongoose = require('mongoose');

const MAINTENANCE_STATUSES = ['Open', 'Closed'];

const maintenanceSchema = new mongoose.Schema(
  {
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    type: { type: String, required: true, trim: true }, // e.g. Oil Change, Tire Replacement
    description: { type: String, trim: true },
    cost: { type: Number, required: true, min: 0, default: 0 },
    status: { type: String, enum: MAINTENANCE_STATUSES, default: 'Open' },
    openedAt: { type: Date, default: Date.now },
    closedAt: { type: Date },
    markVehicleRetired: { type: Boolean, default: false }, // if true, closing sends vehicle to Retired instead of Available
  },
  { timestamps: true }
);

module.exports = { Maintenance: mongoose.model('Maintenance', maintenanceSchema), MAINTENANCE_STATUSES };
