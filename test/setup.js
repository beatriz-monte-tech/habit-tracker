const mongoose = require('mongoose');

// Configuração do ambiente de teste
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_key';
process.env.MONGODB_URI = 'mongodb://localhost:27017/habit-tracker-test';

// Conectar ao banco de teste
const connectTestDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Conectado ao banco de teste');
  } catch (error) {
    console.error('Erro ao conectar no banco de teste:', error);
    process.exit(1);
  }
};

// Limpar banco antes dos testes
const clearDatabase = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};

// Fechar conexão após os testes
const closeDatabase = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
};

module.exports = {
  connectTestDB,
  clearDatabase,
  closeDatabase
};
