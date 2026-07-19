const mongoose = require('mongoose');
const { User } = require('../models/User');
const { Vehicle } = require('../models/Vehicle');
const { Driver } = require('../models/Driver');
const { Trip } = require('../models/Trip');
const { FuelLog } = require('../models/FuelLog');
const { Maintenance } = require('../models/Maintenance');
const { Expense } = require('../models/Expense');
const { loadBackendEnv } = require('./env');

const MONGO_URI = loadBackendEnv();

const demoUsers = [
  { name: 'Fiona Mercer', email: 'fleet.manager@transitops.demo', password: 'password123', role: 'FleetManager' },
  { name: 'Deepak Rao', email: 'driver@transitops.demo', password: 'password123', role: 'Driver' },
  { name: 'Sana Iyer', email: 'safety.officer@transitops.demo', password: 'password123', role: 'SafetyOfficer' },
  { name: 'Victor Lin', email: 'analyst@transitops.demo', password: 'password123', role: 'FinancialAnalyst' },
];

const demoVehicles = [
  { registrationNumber: 'DL-01-AB-1234', name: 'Tata Ace Gold', type: 'Mini Truck', maxLoadCapacity: 750, odometer: 12500, acquisitionCost: 650000, status: 'Available', region: 'North' },
  { registrationNumber: 'DL-02-CD-5678', name: 'Mahindra Bolero Pickup', type: 'Truck', maxLoadCapacity: 1500, odometer: 34200, acquisitionCost: 950000, status: 'Available', region: 'North' },
  { registrationNumber: 'MH-04-EF-4321', name: 'Force Traveller', type: 'Van', maxLoadCapacity: 500, odometer: 8900, acquisitionCost: 1200000, status: 'Available', region: 'West' },
  { registrationNumber: 'KA-05-GH-9876', name: 'Ashok Leyland Dost', type: 'Mini Truck', maxLoadCapacity: 1000, odometer: 51000, acquisitionCost: 780000, status: 'In Shop', region: 'South' },
  { registrationNumber: 'DL-01-XY-0007', name: 'Old Van-05', type: 'Van', maxLoadCapacity: 500, odometer: 98000, acquisitionCost: 400000, status: 'Retired', region: 'North' },
];

const demoDrivers = [
  { name: 'Alex Fernandes', licenseNumber: 'DL0120230001', licenseCategory: 'LMV', licenseExpiryDate: new Date('2027-06-01'), contactNumber: '9810000001', email: 'alex.driver@transitops.demo', safetyScore: 95, status: 'Available' },
  { name: 'Priya Menon', licenseNumber: 'DL0120230002', licenseCategory: 'HMV', licenseExpiryDate: new Date('2026-12-01'), contactNumber: '9810000002', email: 'priya.driver@transitops.demo', safetyScore: 88, status: 'Available' },
  { name: 'Ravi Kumar', licenseNumber: 'DL0120230003', licenseCategory: 'HMV', licenseExpiryDate: new Date('2025-01-01'), contactNumber: '9810000003', email: 'sih49208@gmail.com', safetyScore: 70, status: 'Available' }, // expired license
  { name: 'Neha Joshi', licenseNumber: 'DL0120230004', licenseCategory: 'LMV', licenseExpiryDate: new Date('2027-03-01'), contactNumber: '9810000004', email: 'neha.driver@transitops.demo', safetyScore: 60, status: 'Suspended' },
];

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected. Seeding database...');

  await Promise.all([
    User.deleteMany({}),
    Vehicle.deleteMany({}),
    Driver.deleteMany({}),
    Trip.deleteMany({}),
    FuelLog.deleteMany({}),
    Maintenance.deleteMany({}),
    Expense.deleteMany({})
  ]);

  // Seed Users
  const seededUsers = [];
  for (const u of demoUsers) {
    const user = await User.create(u);
    seededUsers.push(user);
  }
  const manager = seededUsers.find(u => u.role === 'FleetManager');

  // Seed Vehicles & Drivers
  const seededVehicles = await Vehicle.insertMany(demoVehicles);
  const seededDrivers = await Driver.insertMany(demoDrivers);

  const tata = seededVehicles[0];
  const bolero = seededVehicles[1];
  const traveller = seededVehicles[2];
  const leyland = seededVehicles[3];

  const alex = seededDrivers[0];
  const priya = seededDrivers[1];
  const ravi = seededDrivers[2];

  // Seed Completed & Active Trips
  const tripsData = [
    {
      source: 'Delhi Hub',
      destination: 'Noida Sector 62',
      vehicle: tata._id,
      driver: alex._id,
      cargoWeight: 600,
      plannedDistance: 28,
      status: 'Completed',
      dispatchedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
      finalOdometer: 12528,
      fuelConsumed: 4.2,
      revenue: 4500,
      createdBy: manager._id
    },
    {
      source: 'Delhi Hub',
      destination: 'Gurugram Phase 3',
      vehicle: bolero._id,
      driver: priya._id,
      cargoWeight: 1200,
      plannedDistance: 45,
      status: 'Completed',
      dispatchedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
      finalOdometer: 34245,
      fuelConsumed: 7.5,
      revenue: 8500,
      createdBy: manager._id
    },
    {
      source: 'Mumbai Port',
      destination: 'Pune Chinchwad',
      vehicle: traveller._id,
      driver: ravi._id,
      cargoWeight: 450,
      plannedDistance: 140,
      status: 'Completed',
      dispatchedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
      finalOdometer: 9040,
      fuelConsumed: 18.2,
      revenue: 18000,
      createdBy: manager._id
    },
    {
      source: 'Bangalore Electronic City',
      destination: 'Kempegowda Airport',
      vehicle: leyland._id,
      driver: alex._id,
      cargoWeight: 800,
      plannedDistance: 52,
      status: 'Completed',
      dispatchedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 1.5 * 60 * 60 * 1000),
      finalOdometer: 51052,
      fuelConsumed: 8.0,
      revenue: 9500,
      createdBy: manager._id
    },
    {
      source: 'Mumbai Port',
      destination: 'Thane Central',
      vehicle: traveller._id,
      driver: priya._id,
      cargoWeight: 500,
      plannedDistance: 32,
      status: 'Dispatched',
      dispatchedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      createdBy: manager._id
    }
  ];

  const seededTrips = await Trip.insertMany(tripsData);

  // Set Force Traveller to 'On Trip' status to display fleet utilization
  traveller.status = 'On Trip';
  await traveller.save();

  // Seed Fuel Logs
  const fuelData = [
    {
      vehicle: tata._id,
      trip: seededTrips[0]._id,
      liters: 15,
      cost: 1450,
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    },
    {
      vehicle: bolero._id,
      trip: seededTrips[1]._id,
      liters: 30,
      cost: 2900,
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    },
    {
      vehicle: traveller._id,
      trip: seededTrips[2]._id,
      liters: 45,
      cost: 4350,
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    },
    {
      vehicle: leyland._id,
      trip: seededTrips[3]._id,
      liters: 25,
      cost: 2420,
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    }
  ];
  await FuelLog.insertMany(fuelData);

  // Seed Maintenance logs
  const maintenanceData = [
    {
      vehicle: tata._id,
      type: 'Oil Change & Filter',
      description: 'Scheduled 10,000 km oil change and air filter replacement.',
      cost: 2500,
      status: 'Closed',
      openedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      closedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000)
    },
    {
      vehicle: bolero._id,
      type: 'Brake Pad Replacement',
      description: 'Front brake pads worn out, replaced with OEM parts.',
      cost: 4800,
      status: 'Closed',
      openedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      closedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000)
    },
    {
      vehicle: leyland._id,
      type: 'Engine Diagnostics',
      description: 'Check engine light is on. Diagnosing sensor issues.',
      cost: 1500,
      status: 'Open',
      openedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    }
  ];
  await Maintenance.insertMany(maintenanceData);

  // Seed Expenses
  const expenseData = [
    {
      vehicle: tata._id,
      trip: seededTrips[0]._id,
      category: 'Toll',
      amount: 150,
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      notes: 'Delhi-Noida Flyway toll charges'
    },
    {
      vehicle: bolero._id,
      trip: seededTrips[1]._id,
      category: 'Parking',
      amount: 200,
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      notes: 'Warehouse parking fee'
    },
    {
      vehicle: traveller._id,
      trip: seededTrips[2]._id,
      category: 'Toll',
      amount: 450,
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      notes: 'Mumbai-Pune Expressway toll'
    }
  ];
  await Expense.insertMany(expenseData);

  console.log('Seed database complete!');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
