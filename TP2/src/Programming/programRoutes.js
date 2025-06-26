const express = require('express');
const router = express.Router();
const controller = require('./programController');
const { verifyToken, requireRole } = require('../Auth/authMiddleware');

router.post('/salas', 
    verifyToken, 
    requireRole('organizador', 'administrador'), 
    controller.createSala);

router.get('/salas', 
    verifyToken, 
    controller.getSalas
);

router.post('/actividades', 
    verifyToken, 
    requireRole('organizador', 'administrador'), 
    controller.createActividad
);

router.get('/actividades/evento/:eventoId', 
    verifyToken, 
    controller.getActividadesPorEvento
);

router.get('/actividades/expositor/:userId', 
    verifyToken, 
    controller.getActividadesPorExpositor
);

router.post('/validar-conflicto', 
    verifyToken, 
    requireRole('organizador', 'administrador'), 
    controller.validarConflicto
);

module.exports = router;