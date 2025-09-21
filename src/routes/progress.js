const express = require('express');
const {
  getHabitProgress,
  getOverallProgress
} = require('../controllers/progressController');
const auth = require('../middlewares/auth');

const router = express.Router();

router.use(auth);

router.get('/overview', getOverallProgress);
router.get('/habit/:habitId', getHabitProgress);

module.exports = router;
