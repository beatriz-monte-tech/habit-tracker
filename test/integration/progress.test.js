const request = require('supertest');
const { expect } = require('chai');
const app = require('../../src/app');
const { connectTestDB, clearDatabase, closeDatabase } = require('../setup');

describe('Progress Routes', () => {
  let authToken;
  let habitId;

  before(async () => {
    await connectTestDB();
  });

  beforeEach(async () => {
    await clearDatabase();
    
    // Registrar usuário
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Ana Silva',
        email: 'ana@teste.com',
        password: '123456'
      });

    authToken = registerResponse.body.token;

    // Criar hábito
    const habitResponse = await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Exercitar-se',
        frequency: 'daily'
      });

    habitId = habitResponse.body.habit._id;
  });

  after(async () => {
    await closeDatabase();
  });

  describe('POST /api/habits/:id/progress', () => {
    it('deve marcar progresso com sucesso', async () => {
      const progressData = {
        completed: true,
        notes: 'Corrida no parque'
      };

      const response = await request(app)
        .post(`/api/habits/${habitId}/progress`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(progressData)
        .expect(200);

      expect(response.body).to.have.property('message', 'Progresso registrado com sucesso');
      expect(response.body.progress).to.have.property('completed', true);
      expect(response.body.progress).to.have.property('notes', progressData.notes);
    });

    it('deve marcar progresso para data específica', async () => {
      const progressData = {
        completed: true,
        date: '2025-09-20',
        notes: 'Exercício de ontem'
      };

      const response = await request(app)
        .post(`/api/habits/${habitId}/progress`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(progressData)
        .expect(200);

      expect(response.body.progress).to.have.property('completed', true);
    });
  });

  describe('GET /api/progress/overview', () => {
    beforeEach(async () => {
      // Criar alguns progressos
      await request(app)
        .post(`/api/habits/${habitId}/progress`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          completed: true,
          date: '2025-09-21'
        });

      await request(app)
        .post(`/api/habits/${habitId}/progress`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          completed: false,
          date: '2025-09-20'
        });
    });

    it('deve retornar visão geral do progresso', async () => {
      const response = await request(app)
        .get('/api/progress/overview')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).to.have.property('overallStats');
      expect(response.body).to.have.property('habitProgress');
      expect(response.body.overallStats).to.have.property('totalHabits', 1);
      expect(response.body.habitProgress).to.be.an('array').with.length(1);
    });
  });

  describe('GET /api/progress/habit/:habitId', () => {
    beforeEach(async () => {
      // Criar progresso
      await request(app)
        .post(`/api/habits/${habitId}/progress`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          completed: true,
          notes: 'Exercício completo'
        });
    });

    it('deve retornar progresso de hábito específico', async () => {
      const response = await request(app)
        .get(`/api/progress/habit/${habitId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).to.have.property('habit');
      expect(response.body).to.have.property('progress');
      expect(response.body).to.have.property('totalDays', 1);
      expect(response.body).to.have.property('completedDays', 1);
      expect(response.body.habit).to.have.property('title', 'Exercitar-se');
    });
  });
});
