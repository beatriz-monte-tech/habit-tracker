const request = require('supertest');
const { expect } = require('chai');
const app = require('../../src/app');
const { connectTestDB, clearDatabase, closeDatabase } = require('../setup');

describe('Habits Routes', () => {
  let authToken;
  let userId;

  before(async () => {
    await connectTestDB();
  });

  beforeEach(async () => {
    await clearDatabase();
    
    // Registrar e fazer login para obter token
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Maria Silva',
        email: 'maria@teste.com',
        password: '123456'
      });

    authToken = registerResponse.body.token;
    userId = registerResponse.body.user.id;
  });

  after(async () => {
    await closeDatabase();
  });

  describe('POST /api/habits', () => {
    it('deve criar um novo hábito com sucesso', async () => {
      const habitData = {
        title: 'Exercitar-se',
        description: '30 minutos de exercício',
        frequency: 'daily',
        target: 1
      };

      const response = await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${authToken}`)
        .send(habitData)
        .expect(201);

      expect(response.body).to.have.property('message', 'Hábito criado com sucesso');
      expect(response.body.habit).to.have.property('title', habitData.title);
      expect(response.body.habit).to.have.property('frequency', habitData.frequency);
      expect(response.body.habit).to.have.property('user', userId);
    });

    it('deve falhar ao criar hábito sem autenticação', async () => {
      const habitData = {
        title: 'Exercitar-se',
        frequency: 'daily'
      };

      const response = await request(app)
        .post('/api/habits')
        .send(habitData)
        .expect(401);

      expect(response.body).to.have.property('message', 'Token não fornecido');
    });

    it('deve falhar ao criar hábito sem dados obrigatórios', async () => {
      const response = await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body).to.have.property('message', 'Título e frequência são obrigatórios');
    });

    it('deve falhar ao criar hábito com frequência inválida', async () => {
      const habitData = {
        title: 'Exercitar-se',
        frequency: 'invalida'
      };

      const response = await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${authToken}`)
        .send(habitData)
        .expect(400);

      expect(response.body).to.have.property('message', 'Frequência inválida');
    });
  });

  describe('GET /api/habits', () => {
    it('deve listar hábitos do usuário autenticado', async () => {
      // Criar alguns hábitos
      await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Exercitar-se',
          frequency: 'daily'
        });

      await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Ler livros',
          frequency: 'weekly'
        });

      const response = await request(app)
        .get('/api/habits')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).to.have.property('count', 2);
      expect(response.body.habits).to.be.an('array').with.length(2);
    });

    it('deve retornar lista vazia para usuário sem hábitos', async () => {
      const response = await request(app)
        .get('/api/habits')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).to.have.property('count', 0);
      expect(response.body.habits).to.be.an('array').with.length(0);
    });
  });

  describe('GET /api/habits/:id', () => {
    let habitId;

    beforeEach(async () => {
      const createResponse = await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Exercitar-se',
          frequency: 'daily'
        });

      habitId = createResponse.body.habit._id;
    });

    it('deve buscar hábito específico', async () => {
      const response = await request(app)
        .get(`/api/habits/${habitId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.habit).to.have.property('_id', habitId);
      expect(response.body.habit).to.have.property('title', 'Exercitar-se');
    });

    it('deve falhar ao buscar hábito inexistente', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .get(`/api/habits/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).to.have.property('message', 'Hábito não encontrado');
    });
  });

  describe('DELETE /api/habits/:id', () => {
    let habitId;

    beforeEach(async () => {
      const createResponse = await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Exercitar-se',
          frequency: 'daily'
        });

      habitId = createResponse.body.habit._id;
    });

    it('deve desativar hábito com sucesso', async () => {
      const response = await request(app)
        .delete(`/api/habits/${habitId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).to.have.property('message', 'Hábito desativado com sucesso');

      // Verificar se não aparece mais na listagem
      const listResponse = await request(app)
        .get('/api/habits')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(listResponse.body.count).to.equal(0);
    });
  });
});
