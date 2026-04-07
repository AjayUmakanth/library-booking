const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/register', authController.postRegister);
router.post('/login', authController.postLogin);
router.post('/logout', authController.postLogout);
router.get('/me', authController.getMe);

module.exports = router;
