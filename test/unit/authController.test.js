const { expect } = require('chai');
const sinon = require('sinon');
const authController = require('../../src/controllers/authController');
const User = require('../../src/models/User');
const jwt = require('jsonwebtoken');

describe('Auth Controller Unit Tests', () => {
  let req, res, next;
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    req = {
      body: {}
    };
    res = {
      status: sandbox.stub().returnsThis(),
      json: sandbox.stub().returnsThis()
    };
    next = sandbox.stub();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('register', () => {
    it('deve criar usuário com sucesso', async () => {
      const userData = {
        name: 'João Silva',
        email: 'joao@teste.com',
        password: '123456'
      };
      
      req.body = userData;

      const mockUser = {
        _id: 'user123',
        name: userData.name,
        email: userData.email,
        save: sandbox.stub().resolves()
      };

      // Mocks
      sandbox.stub(User, 'findOne').resolves(null);
      sandbox.stub(User.prototype, 'save').resolves(mockUser);
      sandbox.stub(jwt, 'sign').returns('fake-token');

      // Executar
      await authController.register(req, res);

      // Verificações
      expect(res.status.calledWith(201)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.args[0][0]).to.have.property('message', 'Usuário criado com sucesso');
      expect(res.json.args[0][0]).to.have.property('token', 'fake-token');
    });

    it('deve falhar se usuário já existir', async () => {
      req.body = {
        name: 'João Silva',
        email: 'joao@teste.com',
        password: '123456'
      };

      const existingUser = { email: 'joao@teste.com' };
      sandbox.stub(User, 'findOne').resolves(existingUser);

      await authController.register(req, res);

      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledWith({ message: 'Email já cadastrado' })).to.be.true;
    });

    it('deve falhar com dados inválidos', async () => {
      req.body = {}; // Dados vazios

      await authController.register(req, res);

      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledWith({ message: 'Todos os campos são obrigatórios' })).to.be.true;
    });
  });

  describe('login', () => {
    it('deve fazer login com sucesso', async () => {
      const loginData = {
        email: 'joao@teste.com',
        password: '123456'
      };
      
      req.body = loginData;

      const mockUser = {
        _id: 'user123',
        name: 'João Silva',
        email: loginData.email,
        comparePassword: sandbox.stub().resolves(true)
      };

      sandbox.stub(User, 'findOne').resolves(mockUser);
      sandbox.stub(jwt, 'sign').returns('fake-token');

      await authController.login(req, res);

      expect(res.json.calledOnce).to.be.true;
      expect(res.json.args[0][0]).to.have.property('message', 'Login realizado com sucesso');
      expect(res.json.args[0][0]).to.have.property('token', 'fake-token');
    });

    it('deve falhar com credenciais inválidas', async () => {
      req.body = {
        email: 'joao@teste.com',
        password: 'senhaerrada'
      };

      const mockUser = {
        comparePassword: sandbox.stub().resolves(false)
      };

      sandbox.stub(User, 'findOne').resolves(mockUser);

      await authController.login(req, res);

      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledWith({ message: 'Credenciais inválidas' })).to.be.true;
    });
  });
});
