import { createPubSub } from "graphql-yoga";

export interface AgentStreamEvent {
  conversationId: string;
  messageId: string;
  type: "TEXT_DELTA" | "TEXT_COMPLETE" | "RUN_STARTED" | "RUN_COMPLETE" | "RUN_ERROR";
  textDelta?: string;
  fullText?: string;
  error?: string;
}

export const pubSub = createPubSub<{
  agentStream: [runId: string, event: AgentStreamEvent];
}>();
