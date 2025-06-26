const express = require('express');
const router = express.Router();
const authController = require('./authController');

router.post('/register', 
    authController.register
);

router.post('/login', 
    authController.login
);

router.post('/setup-totp', 
    authController.setupTOTP
);

router.post('/verify-totp', 
    authController.verifyTOTP
);

router.post('/refresh', 
    authController.refreshToken
);

module.exports = router;