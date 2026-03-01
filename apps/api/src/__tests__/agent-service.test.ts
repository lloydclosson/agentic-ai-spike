import { describe, expect, it } from "vitest";
import { type AgentStreamEvent, pubSub } from "../graphql/pubsub.js";
import { AgentService } from "../services/agent-service.js";

describe("AgentService", () => {
  it("emits correct event sequence: RUN_STARTED -> TEXT_DELTA* -> TEXT_COMPLETE -> RUN_COMPLETE", async () => {
    const service = new AgentService();
    const runId = "test-run-123";
    const events: AgentStreamEvent[] = [];

    const sub = pubSub.subscribe("agentStream", runId);

    const collectEvents = (async () => {
      for await (const event of sub) {
        events.push(event);
        if (event.type === "RUN_COMPLETE") break;
      }
    })();

    await service.streamResponse({
      runId,
      conversationId: "conv-1",
      messageId: "msg-1",
      userMessage: "Hello",
    });

    await collectEvents;

    expect(events.length).toBeGreaterThanOrEqual(4);

    expect(events[0].type).toBe("RUN_STARTED");
    expect(events[0].conversationId).toBe("conv-1");
    expect(events[0].messageId).toBe("msg-1");

    const deltas = events.filter((e) => e.type === "TEXT_DELTA");
    expect(deltas.length).toBeGreaterThan(0);
    for (const delta of deltas) {
      expect(delta.textDelta).toBeTruthy();
    }

    const textComplete = events.find((e) => e.type === "TEXT_COMPLETE");
    expect(textComplete).toBeDefined();
    expect(textComplete?.fullText).toBeTruthy();
    expect(textComplete?.fullText?.length).toBeGreaterThan(0);

    const lastEvent = events[events.length - 1];
    expect(lastEvent.type).toBe("RUN_COMPLETE");
  });

  it("returns the full response text", async () => {
    const service = new AgentService();
    const runId = "test-run-456";

    // Subscribe and drain to prevent backpressure
    const sub = pubSub.subscribe("agentStream", runId);
    const drain = (async () => {
      for await (const event of sub) {
        if (event.type === "RUN_COMPLETE") break;
      }
    })();

    const result = await service.streamResponse({
      runId,
      conversationId: "conv-2",
      messageId: "msg-2",
      userMessage: "Test",
    });

    await drain;

    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });
});
