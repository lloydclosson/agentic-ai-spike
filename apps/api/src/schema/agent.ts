import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { agents } from "../db/schema.js";
import { builder } from "./builder.js";

const AgentRef = builder.drizzleObject("agents", {
  name: "Agent",
  fields: (t) => ({
    id: t.exposeInt("id"),
    name: t.exposeString("name"),
    description: t.field({
      type: "String",
      nullable: true,
      resolve: (agent) => agent.description,
    }),
    model: t.exposeString("model"),
    createdAt: t.field({
      type: "String",
      resolve: (agent) => agent.createdAt.toISOString(),
    }),
  }),
});

builder.queryFields((t) => ({
  health: t.field({
    type: "String",
    resolve: () => "ok",
  }),
  agents: t.field({
    type: [AgentRef],
    resolve: async () => {
      return db.select().from(agents);
    },
  }),
  agent: t.field({
    type: AgentRef,
    nullable: true,
    args: {
      id: t.arg.int({ required: true }),
    },
    resolve: async (_root, { id }) => {
      const results = await db.select().from(agents).where(eq(agents.id, id));
      return results[0] ?? null;
    },
  }),
}));

builder.mutationFields((t) => ({
  createAgent: t.field({
    type: AgentRef,
    args: {
      name: t.arg.string({ required: true }),
      description: t.arg.string(),
      model: t.arg.string(),
    },
    resolve: async (_root, { name, description, model }) => {
      const [agent] = await db
        .insert(agents)
        .values({
          name,
          description: description ?? null,
          model: model ?? "openai:gpt-4o",
        })
        .returning();
      return agent;
    },
  }),
}));
