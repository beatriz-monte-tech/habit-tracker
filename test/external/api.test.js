const request = require('supertest');
const { expect } = require('chai');

// URL da API - pode ser local, staging ou produção
const API_URL = process.env.API_URL || 'http://localhost:3000';

describe('External API Tests', () => {
  let authToken;
  let userId;
  let habitId;

  describe('API Health Check', () => {
    it('deve responder no endpoint de health', async () => {
      const response = await request(API_URL)
        .get('/health')
        .expect(200);

      expect(response.body).to.have.property('status', 'OK');
      expect(response.body).to.have.property('endpoints');
    });
  });

  describe('External Auth Flow', () => {
    it('deve completar fluxo de registro e login', async () => {
      const timestamp = Date.now();
      const userData = {
        name: 'Usuario Teste External',
        email: `teste${timestamp}@external.com`,
        password: 'senha123'
      };

      // Registro
      const registerResponse = await request(API_URL)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(registerResponse.body).to.have.property('token');
      expect(registerResponse.body.user).to.have.property('email', userData.email);

      authToken = registerResponse.body.token;
      userId = registerResponse.body.user.id;

      // Login
      const loginResponse = await request(API_URL)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      expect(loginResponse.body).to.have.property('token');
    });
  });

  describe('External Habit Management', () => {
    before(async () => {
      // Setup: criar usuário para testes
      const timestamp = Date.now();
      const registerResponse = await request(API_URL)
        .post('/api/auth/register')
        .send({
          name: 'Usuario Habits',
          email: `habits${timestamp}@external.com`,
          password: 'senha123'
        });

      authToken = registerResponse.body.token;
    });

    it('deve gerenciar hábitos end-to-end', async () => {
      // Criar hábito
      const habitData = {
        title: 'Hábito Teste External',
        description: 'Descrição do teste externo',
        frequency: 'daily',
        target: 2
      };

      const createResponse = await request(API_URL)
        .post('/api/habits')
        .set('Authorization', `Bearer ${authToken}`)
        .send(habitData)
        .expect(201);

      expect(createResponse.body.habit).to.have.property('title', habitData.title);
      habitId = createResponse.body.habit._id;

      // Listar hábitos
      const listResponse = await request(API_URL)
        .get('/api/habits')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(listResponse.body.habits).to.be.an('array').with.length.at.least(1);

      // Marcar progresso
      const progressResponse = await request(API_URL)
        .post(`/api/habits/${habitId}/progress`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          completed: true,
          notes: 'Teste externo de progresso'
        })
        .expect(200);

      expect(progressResponse.body.progress).to.have.property('completed', true);

      // Ver estatísticas
      const statsResponse = await request(API_URL)
        .get('/api/progress/overview')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(statsResponse.body).to.have.property('overallStats');
      expect(statsResponse.body.overallStats).to.have.property('totalHabits').at.least(1);
    });
  });

  describe('External GraphQL Tests', () => {
    before(async () => {
      const timestamp = Date.now();
      const registerMutation = `
        mutation {
          register(name: "GraphQL User", email: "graphql${timestamp}@external.com", password: "senha123") {
            token
          }
        }
      `;

      const response = await request(API_URL)
        .post('/graphql')
        .send({ query: registerMutation });

      authToken = response.body.data.register.token;
    });

    it('deve funcionar fluxo GraphQL end-to-end', async () => {
      // Criar hábito via GraphQL
      const createMutation = `
        mutation {
          createHabit(title: "GraphQL Habit", frequency: "weekly", target: 3) {
            id
            title
            frequency
            target
          }
        }
      `;

      const createResponse = await request(API_URL)
        .post('/graphql')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ query: createMutation })
        .expect(200);

      expect(createResponse.body.data.createHabit).to.have.property('title', 'GraphQL Habit');
      const graphqlHabitId = createResponse.body.data.createHabit.id;

      // Listar via GraphQL
      const listQuery = `
        query {
          habits {
            id
            title
            frequency
          }
        }
      `;

      const listResponse = await request(API_URL)
        .post('/graphql')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ query: listQuery })
        .expect(200);

      expect(listResponse.body.data.habits).to.be.an('array').with.length.at.least(1);

      // Marcar progresso via GraphQL
      const progressMutation = `
        mutation {
          markProgress(habitId: "${graphqlHabitId}", completed: true, notes: "GraphQL progress") {
            completed
            notes
          }
        }
      `;

      const progressResponse = await request(API_URL)
        .post('/graphql')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ query: progressMutation })
        .expect(200);

      expect(progressResponse.body.data.markProgress).to.have.property('completed', true);
    });
  });

  describe('Error Handling', () => {
    it('deve tratar erros de autenticação', async () => {
      await request(API_URL)
        .get('/api/habits')
        .expect(401);
    });

    it('deve tratar rotas inexistentes', async () => {
      await request(API_URL)
        .get('/api/rota-inexistente')
        .expect(404);
    });
  });
});
