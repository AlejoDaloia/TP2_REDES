const express = require('express');
const router = express.Router();
const controller = require('./notificationController');
const { verifyToken, requireRole } = require('../Auth/authMiddleware');

router.post('/', 
    verifyToken, 
    requireRole(['organizador', 'administrador']), 
    controller.crearNotificacion
);

router.get('/usuario/:userId', 
    verifyToken, 
    controller.obtenerNotificacionesPorUsuario
);

router.get('/evento/:eventoId', 
    verifyToken, 
    controller.obtenerNotificacionesPorEvento
);

router.post('/suscribirse/:eventoId', 
    verifyToken, 
    controller.suscribirseAEvento
);

router.delete('/suscribirse/:eventoId', 
    verifyToken, 
    controller.cancelarSuscripcion
);

module.exports = router;