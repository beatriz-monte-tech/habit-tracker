const Progress = require('../models/Progress');
const Habit = require('../models/Habit');

exports.getHabitProgress = async (req, res) => {
  try {
    const habitId = req.params.habitId;
    const { startDate, endDate } = req.query;

    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }

    const progress = await Progress.find({
      user: req.user._id,
      habit: habitId,
      ...dateFilter
    }).sort({ date: -1 });

    const habit = await Habit.findOne({
      _id: habitId,
      user: req.user._id
    });

    if (!habit) {
      return res.status(404).json({ message: 'Hábito não encontrado' });
    }

    res.json({ 
      habit: {
        id: habit._id,
        title: habit.title,
        frequency: habit.frequency
      },
      progress,
      totalDays: progress.length,
      completedDays: progress.filter(p => p.completed).length
    });
  } catch (error) {
    console.error('Erro ao buscar progresso do hábito:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

exports.getOverallProgress = async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const daysAgo = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    const habits = await Habit.find({ 
      user: req.user._id, 
      isActive: true 
    });

    const progressData = await Promise.all(
      habits.map(async (habit) => {
        // Buscar progresso para este hábito
        const progress = await Progress.find({
          user: req.user._id,
          habit: habit._id,
          date: { $gte: startDate }
        }).sort({ date: -1 });

        const totalDays = progress.length;
        const completedDays = progress.filter(p => p.completed).length;
        const successRate = totalDays > 0 ? (completedDays / totalDays) * 100 : 0;

        // Calcular streak atual (dias consecutivos)
        let currentStreak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Ordenar por data decrescente e verificar consecutivos
        for (let i = 0; i < progress.length; i++) {
          const progressDate = new Date(progress[i].date);
          progressDate.setHours(0, 0, 0, 0);
          
          const expectedDate = new Date(today);
          expectedDate.setDate(today.getDate() - i);
          
          if (progressDate.getTime() === expectedDate.getTime() && progress[i].completed) {
            currentStreak++;
          } else {
            break;
          }
        }

        return {
          habit: {
            id: habit._id,
            title: habit.title,
            frequency: habit.frequency
          },
          stats: {
            totalDays,
            completedDays,
            missedDays: totalDays - completedDays,
            successRate: Math.round(successRate * 100) / 100,
            currentStreak
          },
          recentProgress: progress.slice(0, 7) // Últimos 7 dias
        };
      })
    );

    // Estatísticas gerais
    const overallStats = {
      totalHabits: habits.length,
      averageSuccessRate: progressData.length > 0 
        ? progressData.reduce((sum, item) => sum + item.stats.successRate, 0) / progressData.length
        : 0,
      totalCompletedDays: progressData.reduce((sum, item) => sum + item.stats.completedDays, 0),
      longestStreak: Math.max(...progressData.map(item => item.stats.currentStreak), 0)
    };

    res.json({
      period: daysAgo,
      overallStats: {
        ...overallStats,
        averageSuccessRate: Math.round(overallStats.averageSuccessRate * 100) / 100
      },
      habitProgress: progressData
    });
  } catch (error) {
    console.error('Erro ao buscar progresso geral:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};
