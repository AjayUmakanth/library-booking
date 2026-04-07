const express = require('express');
const bookingController = require('../controllers/bookingController');

const router = express.Router();

router.get('/:token', bookingController.getCancelToken);
router.post('/:token', bookingController.postCancelToken);

module.exports = router;
