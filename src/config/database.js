const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/habit-tracker');
    console.log(`MongoDB conectado: ${conn.connection.host}`);
  } catch (error) {
    console.error('Erro ao conectar no MongoDB:', error.message);
    console.log('Continuando sem banco de dados...');
  }
};

module.exports = connectDB;
