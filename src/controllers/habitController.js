const Habit = require('../models/Habit');
const Progress = require('../models/Progress');

exports.createHabit = async (req, res) => {
  try {
    const { title, description, frequency, customDays, target, endDate } = req.body;

    // Validações básicas
    if (!title || !frequency) {
      return res.status(400).json({ message: 'Título e frequência são obrigatórios' });
    }

    if (!['daily', 'weekly', 'monthly', 'custom'].includes(frequency)) {
      return res.status(400).json({ message: 'Frequência inválida' });
    }

    const habit = new Habit({
      title,
      description,
      frequency,
      customDays,
      target: target || 1,
      endDate,
      user: req.user._id
    });

    await habit.save();
    res.status(201).json({ 
      message: 'Hábito criado com sucesso', 
      habit 
    });
  } catch (error) {
    console.error('Erro ao criar hábito:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

exports.getHabits = async (req, res) => {
  try {
    const habits = await Habit.find({ 
      user: req.user._id,
      isActive: true 
    }).sort({ createdAt: -1 });
    
    res.json({ 
      message: 'Hábitos encontrados',
      count: habits.length,
      habits 
    });
  } catch (error) {
    console.error('Erro ao buscar hábitos:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

exports.getHabit = async (req, res) => {
  try {
    const habit = await Habit.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!habit) {
      return res.status(404).json({ message: 'Hábito não encontrado' });
    }

    res.json({ habit });
  } catch (error) {
    console.error('Erro ao buscar hábito:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

exports.updateHabit = async (req, res) => {
  try {
    const { title, description, frequency, customDays, target, endDate } = req.body;

    const habit = await Habit.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      {
        title,
        description,
        frequency,
        customDays,
        target,
        endDate
      },
      { new: true }
    );

    if (!habit) {
      return res.status(404).json({ message: 'Hábito não encontrado' });
    }

    res.json({ 
      message: 'Hábito atualizado com sucesso', 
      habit 
    });
  } catch (error) {
    console.error('Erro ao atualizar hábito:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

exports.deleteHabit = async (req, res) => {
  try {
    const habit = await Habit.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isActive: false },
      { new: true }
    );

    if (!habit) {
      return res.status(404).json({ message: 'Hábito não encontrado' });
    }

    res.json({ message: 'Hábito desativado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar hábito:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

exports.markProgress = async (req, res) => {
  try {
    const { completed, notes } = req.body;
    const habitId = req.params.id;
    const date = req.body.date ? new Date(req.body.date) : new Date();
    
    // Normalizar data (apenas ano, mês e dia)
    date.setHours(0, 0, 0, 0);

    // Verificar se o hábito existe e pertence ao usuário
    const habit = await Habit.findOne({
      _id: habitId,
      user: req.user._id
    });

    if (!habit) {
      return res.status(404).json({ message: 'Hábito não encontrado' });
    }

    // Criar ou atualizar progresso
    const progress = await Progress.findOneAndUpdate(
      { user: req.user._id, habit: habitId, date },
      { completed: completed || false, notes },
      { upsert: true, new: true }
    );

    res.json({ 
      message: 'Progresso registrado com sucesso', 
      progress 
    });
  } catch (error) {
    console.error('Erro ao marcar progresso:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};
