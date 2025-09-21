const { gql } = require('apollo-server-express');

const typeDefs = gql`
  type User {
    id: ID!
    name: String!
    email: String!
  }

  type Habit {
    id: ID!
    title: String!
    description: String
    frequency: String!
    target: Int!
    isActive: Boolean!
    createdAt: String!
  }

  type Progress {
    id: ID!
    date: String!
    completed: Boolean!
    notes: String
    habit: Habit!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Query {
    me: User
    habits: [Habit!]!
    habit(id: ID!): Habit
    progress(habitId: ID!): [Progress!]!
  }

  type Mutation {
    register(name: String!, email: String!, password: String!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
    createHabit(title: String!, description: String, frequency: String!, target: Int): Habit!
    markProgress(habitId: ID!, completed: Boolean!, notes: String, date: String): Progress!
  }
`;

module.exports = typeDefs;
