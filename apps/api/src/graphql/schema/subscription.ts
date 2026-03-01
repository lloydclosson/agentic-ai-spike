import type { GraphQLContext } from "../context.js";

export const subscriptionTypeDefs = /* GraphQL */ `
  type AgentStreamEvent {
    conversationId: ID!
    messageId: ID!
    type: String!
    textDelta: String
    fullText: String
    error: String
  }
`;

export const subscriptionResolvers = {
  Subscription: {
    agentStream: {
      subscribe: (_parent: unknown, args: { runId: string }, ctx: GraphQLContext) => {
        return ctx.pubSub.subscribe("agentStream", args.runId);
      },
      resolve: (event: unknown) => event,
    },
  },
};
