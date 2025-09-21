const express = require('express');
const connectDB = require('./src/config/database');
require('dotenv').config();

const app = require('./src/app');

// Conectar ao banco
connectDB();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
