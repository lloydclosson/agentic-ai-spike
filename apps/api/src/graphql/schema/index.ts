import { createSchema } from "graphql-yoga";
import type { GraphQLContext } from "../context.js";
import { conversationResolvers, conversationTypeDefs } from "./conversation.js";
import { employeeResolvers, employeeTypeDefs } from "./employee.js";
import { ptoResolvers, ptoTypeDefs } from "./pto.js";
import { ptoAccrualResolvers, ptoAccrualTypeDefs } from "./pto-accrual.js";
import { subscriptionResolvers, subscriptionTypeDefs } from "./subscription.js";

const rootTypeDefs = /* GraphQL */ `
  type Query {
    employees: [Employee!]!
    employee(id: ID!): Employee

    ptoAccruals(employeeId: ID): [PtoAccrual!]!
    ptoAccrual(id: ID!): PtoAccrual

    ptoRecords(employeeId: ID): [Pto!]!
    ptoRecord(id: ID!): Pto

    conversations(employeeId: ID): [Conversation!]!
    conversation(id: ID!): Conversation
  }

  type Mutation {
    createEmployee(input: CreateEmployeeInput!): Employee!
    updateEmployee(id: ID!, input: UpdateEmployeeInput!): Employee
    deleteEmployee(id: ID!): Boolean!

    createPtoAccrual(input: CreatePtoAccrualInput!): PtoAccrual!
    updatePtoAccrual(id: ID!, input: UpdatePtoAccrualInput!): PtoAccrual
    deletePtoAccrual(id: ID!): Boolean!

    createPto(input: CreatePtoInput!): Pto!
    deletePto(id: ID!): Boolean!

    createConversation(title: String): Conversation!
    sendMessage(conversationId: ID!, content: String!): SendMessageResult!
    deleteConversation(id: ID!): Boolean!
  }

  type Subscription {
    agentStream(runId: ID!): AgentStreamEvent!
  }
`;

// biome-ignore lint/suspicious/noExplicitAny: resolver merging requires flexible types
function deepMerge(...objects: Record<string, any>[]): Record<string, any> {
  // biome-ignore lint/suspicious/noExplicitAny: resolver merging requires flexible types
  const result: Record<string, any> = {};
  for (const obj of objects) {
    for (const [key, value] of Object.entries(obj)) {
      if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value) &&
        typeof result[key] === "object" &&
        result[key] !== null
      ) {
        result[key] = deepMerge(result[key], value);
      } else {
        result[key] = value;
      }
    }
  }
  return result;
}

export const schema = createSchema<GraphQLContext>({
  typeDefs: [
    rootTypeDefs,
    employeeTypeDefs,
    ptoAccrualTypeDefs,
    ptoTypeDefs,
    conversationTypeDefs,
    subscriptionTypeDefs,
  ],
  resolvers: deepMerge(
    employeeResolvers,
    ptoAccrualResolvers,
    ptoResolvers,
    conversationResolvers,
    subscriptionResolvers,
  ),
});
