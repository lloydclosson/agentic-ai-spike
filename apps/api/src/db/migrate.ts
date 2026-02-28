import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required");

const db = drizzle(url);

await migrate(db, { migrationsFolder: "./drizzle" });

console.log("Migrations complete");
