const express = require('express');
const cors = require('cors');
const { ApolloServer } = require('apollo-server-express');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

// GraphQL
const typeDefs = require('./graphql/schema');
const resolvers = require('./graphql/resolvers');

// Routes REST
const authRoutes = require('./routes/auth');
const habitRoutes = require('./routes/habits');
const progressRoutes = require('./routes/progress');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// REST Routes
app.use('/api/auth', authRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/progress', progressRoutes);

// GraphQL Context (autenticação)
const getUser = async (req) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_temporario');
      const user = await User.findById(decoded.userId).select('-password');
      return user;
    } catch (error) {
      return null;
    }
  }
  
  return null;
};

// Configurar Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req }) => {
    const user = await getUser(req);
    return { user };
  }
});

// Aplicar GraphQL middleware
async function startServer() {
  await server.start();
  server.applyMiddleware({ app, path: '/graphql' });
}

startServer();

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    endpoints: {
      rest: '/api',
      graphql: '/graphql'
    }
  });
});

module.exports = app;
