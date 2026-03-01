import { beforeEach, describe, expect, it } from "vitest";
import { executeGraphQL, truncateAll } from "./setup.js";

let employeeId: string;

async function createTestEmployee() {
  const result = await executeGraphQL(`
    mutation {
      createEmployee(input: {
        firstName: "Jane"
        lastName: "Smith"
        ssn: "123-45-6789"
        payRate: "75000.00"
      }) { id }
    }
  `);
  return result.data.createEmployee.id;
}

describe("Conversation CRUD", () => {
  beforeEach(async () => {
    await truncateAll();
    employeeId = await createTestEmployee();
  });

  it("creates a conversation with x-employee-id header", async () => {
    const result = await executeGraphQL(
      `
        mutation {
          createConversation(title: "Test Chat") {
            id
            employeeId
            title
          }
        }
      `,
      undefined,
      { "x-employee-id": employeeId },
    );

    expect(result.errors).toBeUndefined();
    expect(result.data.createConversation.employeeId).toBe(employeeId);
    expect(result.data.createConversation.title).toBe("Test Chat");
  });

  it("rejects createConversation without x-employee-id header", async () => {
    const result = await executeGraphQL(`
      mutation {
        createConversation(title: "No Auth") {
          id
        }
      }
    `);

    expect(result.errors).toBeDefined();
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("queries conversations by employeeId", async () => {
    await executeGraphQL(`mutation { createConversation(title: "Chat 1") { id } }`, undefined, {
      "x-employee-id": employeeId,
    });
    await executeGraphQL(`mutation { createConversation(title: "Chat 2") { id } }`, undefined, {
      "x-employee-id": employeeId,
    });

    const result = await executeGraphQL(
      `
        query($employeeId: ID!) {
          conversations(employeeId: $employeeId) {
            id
            title
          }
        }
      `,
      { employeeId },
    );

    expect(result.data.conversations).toHaveLength(2);
  });

  it("queries a single conversation with messages", async () => {
    const createResult = await executeGraphQL(
      `mutation { createConversation(title: "Chat") { id } }`,
      undefined,
      { "x-employee-id": employeeId },
    );
    const convId = createResult.data.createConversation.id;

    const result = await executeGraphQL(
      `
        query($id: ID!) {
          conversation(id: $id) {
            id
            title
            messages {
              id
              role
              content
            }
          }
        }
      `,
      { id: convId },
    );

    expect(result.data.conversation.title).toBe("Chat");
    expect(result.data.conversation.messages).toHaveLength(0);
  });

  it("deletes a conversation", async () => {
    const createResult = await executeGraphQL(
      `mutation { createConversation(title: "To Delete") { id } }`,
      undefined,
      { "x-employee-id": employeeId },
    );
    const convId = createResult.data.createConversation.id;

    const deleteResult = await executeGraphQL(
      `mutation($id: ID!) { deleteConversation(id: $id) }`,
      { id: convId },
    );

    expect(deleteResult.data.deleteConversation).toBe(true);

    const queryResult = await executeGraphQL(`query($id: ID!) { conversation(id: $id) { id } }`, {
      id: convId,
    });

    expect(queryResult.data.conversation).toBeNull();
  });
});

describe("sendMessage", () => {
  let conversationId: string;

  beforeEach(async () => {
    await truncateAll();
    employeeId = await createTestEmployee();

    const convResult = await executeGraphQL(
      `mutation { createConversation(title: "Test") { id } }`,
      undefined,
      { "x-employee-id": employeeId },
    );
    conversationId = convResult.data.createConversation.id;
  });

  it("sends a message and returns user message, assistant placeholder, and runId", async () => {
    const result = await executeGraphQL(
      `
        mutation($convId: ID!) {
          sendMessage(conversationId: $convId, content: "Hello AI") {
            userMessage {
              id
              role
              content
              status
            }
            assistantMessage {
              id
              role
              content
              status
            }
            runId
          }
        }
      `,
      { convId: conversationId },
      { "x-employee-id": employeeId },
    );

    expect(result.errors).toBeUndefined();
    const { userMessage, assistantMessage, runId } = result.data.sendMessage;

    expect(userMessage.role).toBe("user");
    expect(userMessage.content).toBe("Hello AI");
    expect(userMessage.status).toBe("complete");

    expect(assistantMessage.role).toBe("assistant");
    expect(assistantMessage.content).toBe("");
    expect(assistantMessage.status).toBe("streaming");

    expect(runId).toBeTruthy();
  });

  it("rejects sendMessage without x-employee-id header", async () => {
    const result = await executeGraphQL(
      `
        mutation($convId: ID!) {
          sendMessage(conversationId: $convId, content: "Hello") {
            runId
          }
        }
      `,
      { convId: conversationId },
    );

    expect(result.errors).toBeDefined();
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("persists both messages after streaming completes", async () => {
    await executeGraphQL(
      `
        mutation($convId: ID!) {
          sendMessage(conversationId: $convId, content: "Tell me about PTO") {
            assistantMessage { id }
            runId
          }
        }
      `,
      { convId: conversationId },
      { "x-employee-id": employeeId },
    );

    // Wait for the async streaming to complete
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const convResult = await executeGraphQL(
      `
        query($id: ID!) {
          conversation(id: $id) {
            messages {
              role
              content
              status
            }
          }
        }
      `,
      { id: conversationId },
    );

    const msgs = convResult.data.conversation.messages;
    expect(msgs).toHaveLength(2);

    const userMsg = msgs.find((m: { role: string }) => m.role === "user");
    const assistantMsg = msgs.find((m: { role: string }) => m.role === "assistant");

    expect(userMsg.content).toBe("Tell me about PTO");
    expect(userMsg.status).toBe("complete");

    expect(assistantMsg.content).toBeTruthy();
    expect(assistantMsg.content.length).toBeGreaterThan(0);
    expect(assistantMsg.status).toBe("complete");
  });
});
