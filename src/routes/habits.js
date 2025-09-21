const express = require('express');
const {
  createHabit,
  getHabits,
  getHabit,
  updateHabit,
  deleteHabit,
  markProgress
} = require('../controllers/habitController');
const auth = require('../middlewares/auth');

const router = express.Router();

// Todas as rotas precisam de autenticação
router.use(auth);

router.post('/', createHabit);
router.get('/', getHabits);
router.get('/:id', getHabit);
router.put('/:id', updateHabit);
router.delete('/:id', deleteHabit);
router.post('/:id/progress', markProgress);

module.exports = router;
