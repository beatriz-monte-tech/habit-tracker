const request = require('supertest');
const { expect } = require('chai');
const app = require('../../src/app');
const { connectTestDB, clearDatabase, closeDatabase } = require('../setup');

describe('GraphQL API', () => {
  let authToken;

  before(async () => {
    await connectTestDB();
    // Aguardar GraphQL server inicializar
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  after(async () => {
    await closeDatabase();
  });

  describe('Auth Mutations', () => {
    it('deve registrar usuário via GraphQL', async () => {
      const mutation = `
        mutation {
          register(name: "Carlos Silva", email: "carlos@teste.com", password: "123456") {
            token
            user {
              id
              name
              email
            }
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .send({ query: mutation })
        .expect(200);

      expect(response.body.data.register).to.have.property('token');
      expect(response.body.data.register.user).to.have.property('name', 'Carlos Silva');
      expect(response.body.data.register.user).to.have.property('email', 'carlos@teste.com');

      authToken = response.body.data.register.token;
    });

    it('deve fazer login via GraphQL', async () => {
      // Primeiro registrar
      const registerMutation = `
        mutation {
          register(name: "Carlos Silva", email: "carlos@teste.com", password: "123456") {
            token
          }
        }
      `;

      await request(app)
        .post('/graphql')
        .send({ query: registerMutation });

      // Depois fazer login
      const loginMutation = `
        mutation {
          login(email: "carlos@teste.com", password: "123456") {
            token
            user {
              id
              name
              email
            }
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .send({ query: loginMutation })
        .expect(200);

      expect(response.body.data.login).to.have.property('token');
      expect(response.body.data.login.user).to.have.property('email', 'carlos@teste.com');
    });
  });

  describe('Habit Operations', () => {
    beforeEach(async () => {
      // Registrar usuário para cada teste
      const registerMutation = `
        mutation {
          register(name: "Carlos Silva", email: "carlos@teste.com", password: "123456") {
            token
          }
        }
      `;

      const registerResponse = await request(app)
        .post('/graphql')
        .send({ query: registerMutation });

      authToken = registerResponse.body.data.register.token;
    });

    it('deve criar hábito via GraphQL', async () => {
      const mutation = `
        mutation {
          createHabit(title: "Meditar", description: "10 minutos de meditação", frequency: "daily") {
            id
            title
            description
            frequency
            target
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ query: mutation })
        .expect(200);

      expect(response.body.data.createHabit).to.have.property('title', 'Meditar');
      expect(response.body.data.createHabit).to.have.property('frequency', 'daily');
      expect(response.body.data.createHabit).to.have.property('target', 1);
    });

    it('deve listar hábitos via GraphQL', async () => {
      // Primeiro criar um hábito
      const createMutation = `
        mutation {
          createHabit(title: "Exercitar", frequency: "daily") {
            id
          }
        }
      `;

      await request(app)
        .post('/graphql')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ query: createMutation });

      // Depois listar
      const query = `
        query {
          habits {
            id
            title
            frequency
            isActive
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ query })
        .expect(200);

      expect(response.body.data.habits).to.be.an('array').with.length(1);
      expect(response.body.data.habits[0]).to.have.property('title', 'Exercitar');
    });

    it('deve marcar progresso via GraphQL', async () => {
      // Criar hábito primeiro
      const createMutation = `
        mutation {
          createHabit(title: "Exercitar", frequency: "daily") {
            id
          }
        }
      `;

      const createResponse = await request(app)
        .post('/graphql')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ query: createMutation });

      const habitId = createResponse.body.data.createHabit.id;

      // Marcar progresso
      const progressMutation = `
        mutation {
          markProgress(habitId: "${habitId}", completed: true, notes: "Corrida matinal") {
            id
            completed
            notes
            habit {
              title
            }
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ query: progressMutation })
        .expect(200);

      expect(response.body.data.markProgress).to.have.property('completed', true);
      expect(response.body.data.markProgress).to.have.property('notes', 'Corrida matinal');
      expect(response.body.data.markProgress.habit).to.have.property('title', 'Exercitar');
    });

    it('deve falhar sem autenticação', async () => {
      const query = `
        query {
          habits {
            id
            title
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .send({ query })
        .expect(200);

      expect(response.body.errors).to.exist;
      expect(response.body.errors[0].message).to.include('Não autenticado');
    });
  });

  describe('User Query', () => {
    beforeEach(async () => {
      const registerMutation = `
        mutation {
          register(name: "Carlos Silva", email: "carlos@teste.com", password: "123456") {
            token
          }
        }
      `;

      const registerResponse = await request(app)
        .post('/graphql')
        .send({ query: registerMutation });

      authToken = registerResponse.body.data.register.token;
    });

    it('deve retornar dados do usuário autenticado', async () => {
      const query = `
        query {
          me {
            id
            name
            email
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ query })
        .expect(200);

      expect(response.body.data.me).to.have.property('name', 'Carlos Silva');
      expect(response.body.data.me).to.have.property('email', 'carlos@teste.com');
    });
  });
});
