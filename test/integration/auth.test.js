const request = require('supertest');
const { expect } = require('chai');
const app = require('../../src/app');
const { connectTestDB, clearDatabase, closeDatabase } = require('../setup');

describe('Auth Routes', () => {
  before(async () => {
    await connectTestDB();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  after(async () => {
    await closeDatabase();
  });

  describe('POST /api/auth/register', () => {
    it('deve registrar um novo usuário com sucesso', async () => {
      const userData = {
        name: 'João Silva',
        email: 'joao@teste.com',
        password: '123456'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).to.have.property('message', 'Usuário criado com sucesso');
      expect(response.body).to.have.property('token');
      expect(response.body.user).to.have.property('name', userData.name);
      expect(response.body.user).to.have.property('email', userData.email);
      expect(response.body.user).to.not.have.property('password');
    });

    it('deve falhar ao registrar usuário sem dados obrigatórios', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({})
        .expect(400);

      expect(response.body).to.have.property('message', 'Todos os campos são obrigatórios');
    });

    it('deve falhar ao registrar usuário com senha muito curta', async () => {
      const userData = {
        name: 'João Silva',
        email: 'joao@teste.com',
        password: '123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).to.have.property('message', 'Senha deve ter pelo menos 6 caracteres');
    });

    it('deve falhar ao registrar usuário com email já existente', async () => {
      const userData = {
        name: 'João Silva',
        email: 'joao@teste.com',
        password: '123456'
      };

      // Primeiro registro
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Segundo registro (deve falhar)
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).to.have.property('message', 'Email já cadastrado');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Criar usuário para testes de login
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'João Silva',
          email: 'joao@teste.com',
          password: '123456'
        });
    });

    it('deve fazer login com credenciais válidas', async () => {
      const loginData = {
        email: 'joao@teste.com',
        password: '123456'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).to.have.property('message', 'Login realizado com sucesso');
      expect(response.body).to.have.property('token');
      expect(response.body.user).to.have.property('email', loginData.email);
    });

    it('deve falhar com credenciais inválidas', async () => {
      const loginData = {
        email: 'joao@teste.com',
        password: 'senhaerrada'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body).to.have.property('message', 'Credenciais inválidas');
    });

    it('deve falhar com email inexistente', async () => {
      const loginData = {
        email: 'inexistente@teste.com',
        password: '123456'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body).to.have.property('message', 'Credenciais inválidas');
    });

    it('deve falhar sem dados obrigatórios', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      expect(response.body).to.have.property('message', 'Email e senha são obrigatórios');
    });
  });
});
