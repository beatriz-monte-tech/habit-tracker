# Habit Tracker API
API completa para rastreamento de hábitos desenvolvida com **Node.js, Express, MongoDB e GraphQL**.

## ⚙️ CI/CD Pipeline
Pipeline automatizada com **GitHub Actions**, executando testes em múltiplos níveis.

---

## 🚀 Funcionalidades
- ✅ Autenticação JWT (registro, login)
- ✅ Gerenciamento de hábitos (CRUD completo)
- ✅ Sistema de progresso com controle por data
- ✅ Estatísticas avançadas (taxa de sucesso, streaks)
- ✅ API REST completa
- ✅ API GraphQL para consultas flexíveis
- ✅ Testes automatizados (unitários, integração, externos)
- ✅ Pipeline CI/CD com GitHub Actions

---

## 🛠️ Tecnologias
- **Backend:** Node.js, Express.js  
- **Banco de dados:** MongoDB, Mongoose  
- **Autenticação:** JWT, bcryptjs  
- **GraphQL:** Apollo Server Express  
- **Testes:** Mocha, Chai, Supertest, Sinon  
- **Pipeline:** GitHub Actions  
- **Outros:** CORS, Rate Limiting, Joi (validação)  

---

## 📋 Endpoints REST

### 🔑 Autenticação
- `POST /api/auth/register` → Registrar usuário  
- `POST /api/auth/login` → Login  

### 📌 Hábitos
- `GET /api/habits` → Listar hábitos  
- `POST /api/habits` → Criar hábito  
- `GET /api/habits/:id` → Buscar hábito  
- `PUT /api/habits/:id` → Atualizar hábito  
- `DELETE /api/habits/:id` → Desativar hábito  
- `POST /api/habits/:id/progress` → Marcar progresso  

### 📊 Progresso
- `GET /api/progress/overview` → Estatísticas gerais  
- `GET /api/progress/habit/:habitId` → Progresso de hábito específico  

---

## 🔍 GraphQL
Acesse **`/graphql`** para o playground GraphQL.

### Queries
```graphql
query {
  me { id name email }
  habits { id title frequency }
  progress(habitId: "ID") { date completed notes }
}
````

### Mutations

```graphql
mutation {
  register(name: "Nome", email: "email@test.com", password: "123456") {
    token
    user { id name email }
  }
  
  createHabit(title: "Exercitar", frequency: "daily") {
    id title frequency
  }
  
  markProgress(habitId: "ID", completed: true, notes: "Nota") {
    id completed notes
  }
}
```

---

## 🧪 Testes

```bash
# Todos os testes
npm test

# Testes unitários (com Sinon)
npm run test:unit

# Testes de integração
npm run test:integration

# Testes externos (API rodando)
npm run test:external

# Testes com coverage
npm run test:coverage
```

### Cobertura de Testes

* ⚡ Unitários: Controllers com mocks (Sinon)
* 🔗 Integração: Fluxos completos com banco
* 🌐 Externos: API real (REST + GraphQL)
* 🚀 Pipeline: Todos os testes na CI/CD

---

## 🚀 Como executar

### Pré-requisitos

* Node.js 18+
* MongoDB

### Instalação

```bash
git clone https://github.com/beatriz-monte-tech/habit-tracker.git
cd habit-tracker-api
npm install
```

### Configuração

Crie um arquivo **`.env`**:

```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/habit-tracker
JWT_SECRET=seu_jwt_secret_super_seguro
```

### Executar

```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

---

## 📊 Arquitetura

```
src/
├── config/         # Configuração do banco
├── controllers/    # Lógica de negócio
├── middlewares/    # Autenticação, validações
├── models/         # Schemas do MongoDB
├── routes/         # Rotas REST
├── graphql/        # Schema e resolvers GraphQL
└── app.js          # Configuração Express
```

---

## 🎯 Funcionalidades dos Hábitos

* Frequências: diária, semanal, mensal, personalizada
* Progresso por data: marque qualquer dia
* Estatísticas: taxa de sucesso, streaks consecutivos
* Notas: adicione observações em cada progresso
* Segurança: cada usuário vê apenas seus dados

---

## 👥 Desenvolvido por

**Beatriz** – Trabalho de Pós-Graduação

---

## 📝 Licença

Este projeto foi desenvolvido para **fins acadêmicos**.

