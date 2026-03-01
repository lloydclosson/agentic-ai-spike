import { describe, expect, it } from "vitest";
import { executeGraphQL } from "./setup.js";

describe("GraphQL Schema", () => {
  it("introspection returns all expected types", async () => {
    const result = await executeGraphQL(`
      {
        __schema {
          types {
            name
            kind
          }
        }
      }
    `);

    const typeNames = result.data.__schema.types.map((t: { name: string }) => t.name);

    expect(typeNames).toContain("Employee");
    expect(typeNames).toContain("PtoAccrual");
    expect(typeNames).toContain("Pto");
    expect(typeNames).toContain("CreateEmployeeInput");
    expect(typeNames).toContain("UpdateEmployeeInput");
    expect(typeNames).toContain("CreatePtoAccrualInput");
    expect(typeNames).toContain("UpdatePtoAccrualInput");
    expect(typeNames).toContain("CreatePtoInput");
    expect(typeNames).toContain("Conversation");
    expect(typeNames).toContain("Message");
    expect(typeNames).toContain("SendMessageResult");
    expect(typeNames).toContain("AgentStreamEvent");
  });

  it("introspection returns all expected query fields", async () => {
    const result = await executeGraphQL(`
      {
        __type(name: "Query") {
          fields {
            name
          }
        }
      }
    `);

    const fieldNames = result.data.__type.fields.map((f: { name: string }) => f.name);

    expect(fieldNames).toContain("employees");
    expect(fieldNames).toContain("employee");
    expect(fieldNames).toContain("ptoAccruals");
    expect(fieldNames).toContain("ptoAccrual");
    expect(fieldNames).toContain("ptoRecords");
    expect(fieldNames).toContain("ptoRecord");
    expect(fieldNames).toContain("conversations");
    expect(fieldNames).toContain("conversation");
  });

  it("introspection returns all expected mutation fields", async () => {
    const result = await executeGraphQL(`
      {
        __type(name: "Mutation") {
          fields {
            name
          }
        }
      }
    `);

    const fieldNames = result.data.__type.fields.map((f: { name: string }) => f.name);

    expect(fieldNames).toContain("createEmployee");
    expect(fieldNames).toContain("updateEmployee");
    expect(fieldNames).toContain("deleteEmployee");
    expect(fieldNames).toContain("createPtoAccrual");
    expect(fieldNames).toContain("updatePtoAccrual");
    expect(fieldNames).toContain("deletePtoAccrual");
    expect(fieldNames).toContain("createPto");
    expect(fieldNames).toContain("deletePto");
    expect(fieldNames).toContain("createConversation");
    expect(fieldNames).toContain("sendMessage");
    expect(fieldNames).toContain("deleteConversation");
  });

  it("introspection returns subscription fields", async () => {
    const result = await executeGraphQL(`
      {
        __type(name: "Subscription") {
          fields {
            name
          }
        }
      }
    `);

    const fieldNames = result.data.__type.fields.map((f: { name: string }) => f.name);

    expect(fieldNames).toContain("agentStream");
  });
});
