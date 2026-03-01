import { eq } from "drizzle-orm";
import { employees, pto } from "../../db/schema.js";
import type { GraphQLContext } from "../context.js";

export const ptoTypeDefs = /* GraphQL */ `
  type Pto {
    id: ID!
    employeeId: ID!
    employee: Employee!
    dateTime: String!
    hoursTaken: String!
    createdAt: String!
  }

  input CreatePtoInput {
    employeeId: ID!
    dateTime: String!
    hoursTaken: String!
  }
`;

export const ptoResolvers = {
  Query: {
    ptoRecords: async (_parent: unknown, args: { employeeId?: string }, ctx: GraphQLContext) => {
      if (args.employeeId) {
        return ctx.db.select().from(pto).where(eq(pto.employeeId, args.employeeId));
      }
      return ctx.db.select().from(pto);
    },
    ptoRecord: async (_parent: unknown, args: { id: string }, ctx: GraphQLContext) => {
      const results = await ctx.db.select().from(pto).where(eq(pto.id, args.id));
      return results[0] ?? null;
    },
  },
  Pto: {
    employee: async (parent: { employeeId: string }, _args: unknown, ctx: GraphQLContext) => {
      const results = await ctx.db
        .select()
        .from(employees)
        .where(eq(employees.id, parent.employeeId));
      return results[0] ?? null;
    },
  },
  Mutation: {
    createPto: async (
      _parent: unknown,
      args: {
        input: {
          employeeId: string;
          dateTime: string;
          hoursTaken: string;
        };
      },
      ctx: GraphQLContext,
    ) => {
      const [record] = await ctx.db
        .insert(pto)
        .values({
          employeeId: args.input.employeeId,
          dateTime: new Date(args.input.dateTime),
          hoursTaken: args.input.hoursTaken,
        })
        .returning();
      return record;
    },
    deletePto: async (_parent: unknown, args: { id: string }, ctx: GraphQLContext) => {
      const results = await ctx.db.delete(pto).where(eq(pto.id, args.id)).returning();
      return results.length > 0;
    },
  },
};
