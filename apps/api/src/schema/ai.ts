import { queryAiService } from "../services/ai-service.js";
import { builder } from "./builder.js";

const AiResponseRef = builder.objectRef<{ answer: string; confidence: number }>("AiResponse");

builder.objectType(AiResponseRef, {
  fields: (t) => ({
    answer: t.exposeString("answer"),
    confidence: t.exposeFloat("confidence"),
  }),
});

builder.mutationFields((t) => ({
  askAi: t.field({
    type: AiResponseRef,
    args: {
      query: t.arg.string({ required: true }),
    },
    resolve: async (_root, { query }) => {
      return queryAiService(query);
    },
  }),
}));
