const express = require('express');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const tripController = require('../controllers/trip.controller');

const router = express.Router();
router.use(auth);

// GET /api/trips - list with filters
router.get('/', tripController.getTrips);

// GET /api/trips/meta
router.get('/meta', tripController.getTripMeta);

// GET /api/trips/:id
router.get('/:id', tripController.getTripById);

// POST /api/trips - create a Draft trip
router.post('/', rbac('FleetManager', 'Driver'), tripController.createTrip);

// POST /api/trips/:id/dispatch - Draft -> Dispatched
router.post('/:id/dispatch', rbac('FleetManager', 'Driver'), tripController.dispatchTrip);

// POST /api/trips/:id/complete - Dispatched -> Completed
router.post('/:id/complete', rbac('FleetManager', 'Driver'), tripController.completeTrip);

// POST /api/trips/:id/cancel - Draft or Dispatched -> Cancelled
router.post('/:id/cancel', rbac('FleetManager', 'Driver'), tripController.cancelTrip);

module.exports = router;
