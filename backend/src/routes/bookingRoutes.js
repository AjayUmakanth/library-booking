const express = require('express');
const bookingController = require('../controllers/bookingController');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

router.use(requireAuth);

router.get('/available', bookingController.getAvailable);
router.post('/', bookingController.postCreate);
router.get('/mine', bookingController.getMine);
router.get('/success/:id', bookingController.getSuccess);
router.post('/:id/cancel', bookingController.postCancelMine);

module.exports = router;
