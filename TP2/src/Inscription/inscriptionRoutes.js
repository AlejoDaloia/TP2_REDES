const express = require('express');
const router = express.Router();
const controller = require('./inscriptionController');
const { verifyToken, requireRole } = require('../Auth/authMiddleware');

router.get('/tipos', 
    verifyToken, 
    controller.getTiposInscripcion
);

router.post('/tipos', 
    verifyToken, 
    requireRole('administrador'), 
    controller.createTipoInscripcion
);

router.put('/tipos/:id', 
    verifyToken, 
    requireRole('administrador'), 
    controller.updateTipoInscripcion
);

router.post('/', 
    verifyToken, 
    controller.inscribirUsuario
);

router.get('/evento/:eventoId', 
    verifyToken, 
    controller.getInscripcionesPorEvento
);

router.get('/usuario/:userId', 
    verifyToken, 
    controller.getInscripcionesPorUsuario
);

module.exports = router;