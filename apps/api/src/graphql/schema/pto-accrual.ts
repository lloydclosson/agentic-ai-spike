import { eq } from "drizzle-orm";
import { employees, ptoAccruals } from "../../db/schema.js";
import type { GraphQLContext } from "../context.js";

export const ptoAccrualTypeDefs = /* GraphQL */ `
  type PtoAccrual {
    id: ID!
    employeeId: ID!
    employee: Employee!
    totalHoursRemaining: String!
    totalHoursAllotted: String!
    createdAt: String!
    updatedAt: String!
  }

  input CreatePtoAccrualInput {
    employeeId: ID!
    totalHoursRemaining: String!
    totalHoursAllotted: String!
  }

  input UpdatePtoAccrualInput {
    totalHoursRemaining: String
    totalHoursAllotted: String
  }
`;

export const ptoAccrualResolvers = {
  Query: {
    ptoAccruals: async (_parent: unknown, args: { employeeId?: string }, ctx: GraphQLContext) => {
      if (args.employeeId) {
        return ctx.db.select().from(ptoAccruals).where(eq(ptoAccruals.employeeId, args.employeeId));
      }
      return ctx.db.select().from(ptoAccruals);
    },
    ptoAccrual: async (_parent: unknown, args: { id: string }, ctx: GraphQLContext) => {
      const results = await ctx.db.select().from(ptoAccruals).where(eq(ptoAccruals.id, args.id));
      return results[0] ?? null;
    },
  },
  PtoAccrual: {
    employee: async (parent: { employeeId: string }, _args: unknown, ctx: GraphQLContext) => {
      const results = await ctx.db
        .select()
        .from(employees)
        .where(eq(employees.id, parent.employeeId));
      return results[0] ?? null;
    },
  },
  Mutation: {
    createPtoAccrual: async (
      _parent: unknown,
      args: {
        input: {
          employeeId: string;
          totalHoursRemaining: string;
          totalHoursAllotted: string;
        };
      },
      ctx: GraphQLContext,
    ) => {
      const [accrual] = await ctx.db.insert(ptoAccruals).values(args.input).returning();
      return accrual;
    },
    updatePtoAccrual: async (
      _parent: unknown,
      args: {
        id: string;
        input: {
          totalHoursRemaining?: string;
          totalHoursAllotted?: string;
        };
      },
      ctx: GraphQLContext,
    ) => {
      const updates: Record<string, string> = {};
      if (args.input.totalHoursRemaining !== undefined)
        updates.totalHoursRemaining = args.input.totalHoursRemaining;
      if (args.input.totalHoursAllotted !== undefined)
        updates.totalHoursAllotted = args.input.totalHoursAllotted;

      if (Object.keys(updates).length === 0) {
        const results = await ctx.db.select().from(ptoAccruals).where(eq(ptoAccruals.id, args.id));
        return results[0] ?? null;
      }

      const results = await ctx.db
        .update(ptoAccruals)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(ptoAccruals.id, args.id))
        .returning();
      return results[0] ?? null;
    },
    deletePtoAccrual: async (_parent: unknown, args: { id: string }, ctx: GraphQLContext) => {
      const results = await ctx.db
        .delete(ptoAccruals)
        .where(eq(ptoAccruals.id, args.id))
        .returning();
      return results.length > 0;
    },
  },
};
