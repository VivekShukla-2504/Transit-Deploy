const mongoose = require('mongoose');

const DRIVER_STATUSES = ['Available', 'On Trip', 'Off Duty', 'Suspended'];

const driverSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    licenseNumber: { type: String, required: true, unique: true, trim: true, uppercase: true },
    licenseCategory: { type: String, required: true, trim: true }, // e.g. LMV, HMV, Motorcycle
    licenseExpiryDate: { type: Date, required: true },
    contactNumber: { type: String, required: true, trim: true },
    safetyScore: { type: Number, default: 100, min: 0, max: 100 },
    status: { type: String, enum: DRIVER_STATUSES, default: 'Available' },
    licenseExpiryNotificationSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

driverSchema.methods.isLicenseExpired = function () {
  return this.licenseExpiryDate < new Date();
};

driverSchema.methods.isDispatchable = function () {
  if (this.status !== 'Available') return false;

  const expiry = new Date(this.licenseExpiryDate);
  expiry.setHours(23, 59, 59, 999);
  return expiry >= new Date();
};

module.exports = { Driver: mongoose.model('Driver', driverSchema), DRIVER_STATUSES };
