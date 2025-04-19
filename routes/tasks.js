const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { createTask } = require('../controllers/tasks');

router.post('/', authenticate, createTask);

module.exports = router;