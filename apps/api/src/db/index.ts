import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { relations } from "./relations.js";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required");

export const db = drizzle({ connection: url, relations });

export { relations };
