const { expect } = require('chai');
const sinon = require('sinon');
const habitController = require('../../src/controllers/habitController');
const Habit = require('../../src/models/Habit');

describe('Habit Controller Unit Tests', () => {
  let req, res, sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    req = {
      user: { _id: 'user123' },
      body: {},
      params: {}
    };
    res = {
      status: sandbox.stub().returnsThis(),
      json: sandbox.stub().returnsThis()
    };
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('createHabit', () => {
    it('deve criar hábito com sucesso', async () => {
      const habitData = {
        title: 'Exercitar-se',
        frequency: 'daily'
      };
      
      req.body = habitData;

      const mockHabit = {
        _id: 'habit123',
        ...habitData,
        user: req.user._id,
        save: sandbox.stub().resolves()
      };

      sandbox.stub(Habit.prototype, 'save').resolves(mockHabit);

      await habitController.createHabit(req, res);

      expect(res.status.calledWith(201)).to.be.true;
      expect(res.json.args[0][0]).to.have.property('message', 'Hábito criado com sucesso');
    });

    it('deve falhar sem dados obrigatórios', async () => {
      req.body = {}; // Sem título e frequência

      await habitController.createHabit(req, res);

      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledWith({ message: 'Título e frequência são obrigatórios' })).to.be.true;
    });
  });

  describe('getHabits', () => {
    it('deve listar hábitos do usuário', async () => {
      const mockHabits = [
        { _id: 'habit1', title: 'Exercitar-se', user: req.user._id },
        { _id: 'habit2', title: 'Ler livros', user: req.user._id }
      ];

      const mockQuery = {
        sort: sandbox.stub().returns(mockHabits)
      };
      
      sandbox.stub(Habit, 'find').returns(mockQuery);

      await habitController.getHabits(req, res);

      expect(res.json.calledOnce).to.be.true;
      expect(res.json.args[0][0]).to.have.property('count', 2);
      expect(res.json.args[0][0]).to.have.property('habits', mockHabits);
    });
  });
});
