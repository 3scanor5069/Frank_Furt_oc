// routes/passwordRoutes.js
const express = require('express');
const { requestPasswordReset, resetPassword } = require('../controllers/passwordController');

const router = express.Router();

router.post('/forgot-password', requestPasswordReset);
router.post('/reset-password', resetPassword);

module.exports = router;
