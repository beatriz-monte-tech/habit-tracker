const User = require('../models/User');
const Habit = require('../models/Habit');
const Progress = require('../models/Progress');
const jwt = require('jsonwebtoken');
const { AuthenticationError } = require('apollo-server-express');

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'secret_temporario', { 
    expiresIn: '7d' 
  });
};

const resolvers = {
  Query: {
    me: async (parent, args, context) => {
      if (!context.user) {
        throw new AuthenticationError('Não autenticado');
      }
      return context.user;
    },

    habits: async (parent, args, context) => {
      if (!context.user) {
        throw new AuthenticationError('Não autenticado');
      }
      
      return await Habit.find({ 
        user: context.user._id,
        isActive: true 
      }).sort({ createdAt: -1 });
    },

    habit: async (parent, { id }, context) => {
      if (!context.user) {
        throw new AuthenticationError('Não autenticado');
      }

      return await Habit.findOne({
        _id: id,
        user: context.user._id
      });
    },

    progress: async (parent, { habitId }, context) => {
      if (!context.user) {
        throw new AuthenticationError('Não autenticado');
      }

      return await Progress.find({
        user: context.user._id,
        habit: habitId
      }).populate('habit').sort({ date: -1 });
    }
  },

  Mutation: {
    register: async (parent, { name, email, password }) => {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new Error('Email já cadastrado');
      }

      const user = new User({ name, email, password });
      await user.save();

      const token = generateToken(user._id);

      return {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email
        }
      };
    },

    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });
      if (!user) {
        throw new Error('Credenciais inválidas');
      }

      const isValidPassword = await user.comparePassword(password);
      if (!isValidPassword) {
        throw new Error('Credenciais inválidas');
      }

      const token = generateToken(user._id);

      return {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email
        }
      };
    },

    createHabit: async (parent, { title, description, frequency, target }, context) => {
      if (!context.user) {
        throw new AuthenticationError('Não autenticado');
      }

      const habit = new Habit({
        title,
        description,
        frequency,
        target: target || 1,
        user: context.user._id
      });

      return await habit.save();
    },

    markProgress: async (parent, { habitId, completed, notes, date }, context) => {
      if (!context.user) {
        throw new AuthenticationError('Não autenticado');
      }

      const progressDate = date ? new Date(date) : new Date();
      progressDate.setHours(0, 0, 0, 0);

      const progress = await Progress.findOneAndUpdate(
        { user: context.user._id, habit: habitId, date: progressDate },
        { completed, notes },
        { upsert: true, new: true }
      ).populate('habit');

      return progress;
    }
  }
};

module.exports = resolvers;
