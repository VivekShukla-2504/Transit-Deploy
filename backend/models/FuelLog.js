const mongoose = require('mongoose');

const fuelLogSchema = new mongoose.Schema(
  {
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip' },
    liters: { type: Number, required: true, min: 0 },
    cost: { type: Number, required: true, min: 0 },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = { FuelLog: mongoose.model('FuelLog', fuelLogSchema) };
