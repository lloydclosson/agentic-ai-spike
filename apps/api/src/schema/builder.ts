import SchemaBuilder from "@pothos/core";
import DrizzlePlugin from "@pothos/plugin-drizzle";
import { getTableConfig } from "drizzle-orm/pg-core";
import { db, relations } from "../db/index.js";

interface PothosTypes {
  DrizzleRelations: typeof relations;
}

export const builder = new SchemaBuilder<PothosTypes>({
  plugins: [DrizzlePlugin],
  drizzle: {
    client: db,
    relations,
    getTableConfig,
  },
});

// Initialize query and mutation types
builder.queryType({});
builder.mutationType({});
