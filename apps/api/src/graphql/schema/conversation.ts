import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { conversations, messages } from "../../db/schema.js";
import type { GraphQLContext } from "../context.js";

export const conversationTypeDefs = /* GraphQL */ `
  type Conversation {
    id: ID!
    employeeId: ID!
    title: String
    messages: [Message!]!
    createdAt: String!
    updatedAt: String!
  }

  type Message {
    id: ID!
    conversationId: ID!
    role: String!
    content: String!
    status: String!
    createdAt: String!
  }

  type SendMessageResult {
    userMessage: Message!
    assistantMessage: Message!
    runId: ID!
  }
`;

export const conversationResolvers = {
  Query: {
    conversations: async (_parent: unknown, args: { employeeId?: string }, ctx: GraphQLContext) => {
      if (args.employeeId) {
        return ctx.db
          .select()
          .from(conversations)
          .where(eq(conversations.employeeId, args.employeeId));
      }
      return ctx.db.select().from(conversations);
    },
    conversation: async (_parent: unknown, args: { id: string }, ctx: GraphQLContext) => {
      const results = await ctx.db
        .select()
        .from(conversations)
        .where(eq(conversations.id, args.id));
      return results[0] ?? null;
    },
  },
  Conversation: {
    messages: async (parent: { id: string }, _args: unknown, ctx: GraphQLContext) => {
      return ctx.db.select().from(messages).where(eq(messages.conversationId, parent.id));
    },
  },
  Mutation: {
    createConversation: async (_parent: unknown, args: { title?: string }, ctx: GraphQLContext) => {
      if (!ctx.currentEmployeeId) {
        throw new Error("x-employee-id header is required");
      }

      const [conversation] = await ctx.db
        .insert(conversations)
        .values({
          employeeId: ctx.currentEmployeeId,
          title: args.title ?? null,
        })
        .returning();
      return conversation;
    },
    sendMessage: async (
      _parent: unknown,
      args: { conversationId: string; content: string },
      ctx: GraphQLContext,
    ) => {
      if (!ctx.currentEmployeeId) {
        throw new Error("x-employee-id header is required");
      }

      const [userMessage] = await ctx.db
        .insert(messages)
        .values({
          conversationId: args.conversationId,
          role: "user",
          content: args.content,
          status: "complete",
        })
        .returning();

      const [assistantMessage] = await ctx.db
        .insert(messages)
        .values({
          conversationId: args.conversationId,
          role: "assistant",
          content: "",
          status: "streaming",
        })
        .returning();

      const runId = randomUUID();

      setImmediate(async () => {
        try {
          const fullText = await ctx.agentService.streamResponse({
            runId,
            conversationId: args.conversationId,
            messageId: assistantMessage.id,
            userMessage: args.content,
          });

          await ctx.db
            .update(messages)
            .set({ content: fullText, status: "complete" })
            .where(eq(messages.id, assistantMessage.id));
        } catch {
          await ctx.db
            .update(messages)
            .set({
              content: "An error occurred while processing your request.",
              status: "error",
            })
            .where(eq(messages.id, assistantMessage.id));
        }
      });

      return {
        userMessage,
        assistantMessage,
        runId,
      };
    },
    deleteConversation: async (_parent: unknown, args: { id: string }, ctx: GraphQLContext) => {
      const results = await ctx.db
        .delete(conversations)
        .where(eq(conversations.id, args.id))
        .returning();
      return results.length > 0;
    },
  },
};
