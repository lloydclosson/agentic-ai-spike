import "dotenv/config";
import { sql } from "drizzle-orm";
import { createYoga } from "graphql-yoga";
import { db } from "../db/index.js";
import { createContext } from "../graphql/context.js";
import { schema } from "../graphql/schema/index.js";

export const yoga = createYoga({
  schema,
  context: createContext,
});

export async function truncateAll() {
  await db.execute(sql`TRUNCATE messages, conversations, pto, pto_accruals, employees CASCADE`);
}

export async function executeGraphQL(
  query: string,
  variables?: Record<string, unknown>,
  headers?: Record<string, string>,
) {
  const response = await yoga.fetch("http://localhost:4000/graphql", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...headers,
    },
    body: JSON.stringify({ query, variables }),
  });

  return response.json();
}
