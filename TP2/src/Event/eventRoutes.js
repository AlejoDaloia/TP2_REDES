const express = require('express');
const router = express.Router();
const eventController = require('./eventController');
const { verifyToken, requireRole } = require('../Auth/authMiddleware');

router.post(
  '/create',
  verifyToken,
  requireRole('organizador', 'administrador'),
  eventController.createEvent
);

router.get(
  '/list',
  verifyToken,
  eventController.listEvents
);

router.get(
  '/:id',
  verifyToken,
  eventController.getEventById
);

router.put(
  '/:id',
  verifyToken,
  requireRole('organizador', 'administrador'),
  eventController.updateEvent
);

router.patch(
  '/:id/status',
  verifyToken,
  requireRole('organizador', 'administrador'),
  eventController.changeEventStatus
);

module.exports = router;