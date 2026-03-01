import { pubSub } from "../graphql/pubsub.js";

const CANNED_RESPONSES = [
  "I can help you with that! Based on the employee records, here's what I found...",
  "Let me look into that PTO request for you. The employee currently has sufficient hours remaining.",
  "I've reviewed the payroll information. Everything looks correct for this pay period.",
];

export class AgentService {
  async streamResponse(params: {
    runId: string;
    conversationId: string;
    messageId: string;
    userMessage: string;
  }): Promise<string> {
    const response = CANNED_RESPONSES[Math.floor(Math.random() * CANNED_RESPONSES.length)];

    pubSub.publish("agentStream", params.runId, {
      conversationId: params.conversationId,
      messageId: params.messageId,
      type: "RUN_STARTED",
    });

    const words = response.split(" ");
    for (const word of words) {
      await new Promise((resolve) => setTimeout(resolve, 50));
      pubSub.publish("agentStream", params.runId, {
        conversationId: params.conversationId,
        messageId: params.messageId,
        type: "TEXT_DELTA",
        textDelta: `${word} `,
      });
    }

    pubSub.publish("agentStream", params.runId, {
      conversationId: params.conversationId,
      messageId: params.messageId,
      type: "TEXT_COMPLETE",
      fullText: response,
    });

    pubSub.publish("agentStream", params.runId, {
      conversationId: params.conversationId,
      messageId: params.messageId,
      type: "RUN_COMPLETE",
    });

    return response;
  }
}

export const agentService = new AgentService();
