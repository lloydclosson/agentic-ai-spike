import { eq } from "drizzle-orm";
import { employees } from "../../db/schema.js";
import type { GraphQLContext } from "../context.js";

export const employeeTypeDefs = /* GraphQL */ `
  type Employee {
    id: ID!
    firstName: String!
    lastName: String!
    ssn: String!
    payRate: String!
    createdAt: String!
    updatedAt: String!
  }

  input CreateEmployeeInput {
    firstName: String!
    lastName: String!
    ssn: String!
    payRate: String!
  }

  input UpdateEmployeeInput {
    firstName: String
    lastName: String
    ssn: String
    payRate: String
  }
`;

export const employeeResolvers = {
  Query: {
    employees: async (_parent: unknown, _args: unknown, ctx: GraphQLContext) => {
      return ctx.db.select().from(employees);
    },
    employee: async (_parent: unknown, args: { id: string }, ctx: GraphQLContext) => {
      const results = await ctx.db.select().from(employees).where(eq(employees.id, args.id));
      return results[0] ?? null;
    },
  },
  Mutation: {
    createEmployee: async (
      _parent: unknown,
      args: {
        input: {
          firstName: string;
          lastName: string;
          ssn: string;
          payRate: string;
        };
      },
      ctx: GraphQLContext,
    ) => {
      const [employee] = await ctx.db.insert(employees).values(args.input).returning();
      return employee;
    },
    updateEmployee: async (
      _parent: unknown,
      args: {
        id: string;
        input: {
          firstName?: string;
          lastName?: string;
          ssn?: string;
          payRate?: string;
        };
      },
      ctx: GraphQLContext,
    ) => {
      const updates: Record<string, string> = {};
      if (args.input.firstName !== undefined) updates.firstName = args.input.firstName;
      if (args.input.lastName !== undefined) updates.lastName = args.input.lastName;
      if (args.input.ssn !== undefined) updates.ssn = args.input.ssn;
      if (args.input.payRate !== undefined) updates.payRate = args.input.payRate;

      if (Object.keys(updates).length === 0) {
        const results = await ctx.db.select().from(employees).where(eq(employees.id, args.id));
        return results[0] ?? null;
      }

      const results = await ctx.db
        .update(employees)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(employees.id, args.id))
        .returning();
      return results[0] ?? null;
    },
    deleteEmployee: async (_parent: unknown, args: { id: string }, ctx: GraphQLContext) => {
      const results = await ctx.db.delete(employees).where(eq(employees.id, args.id)).returning();
      return results.length > 0;
    },
  },
};
