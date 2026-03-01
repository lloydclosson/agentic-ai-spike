import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "./index.js";
import { conversations, employees, messages, pto, ptoAccruals } from "./schema.js";

const sampleEmployees = [
  { firstName: "Jane", lastName: "Smith", ssn: "123-45-6789", payRate: "75000.00" },
  { firstName: "John", lastName: "Doe", ssn: "234-56-7890", payRate: "65000.00" },
  { firstName: "Alice", lastName: "Johnson", ssn: "345-67-8901", payRate: "82000.00" },
  { firstName: "Bob", lastName: "Williams", ssn: "456-78-9012", payRate: "71000.00" },
  { firstName: "Carol", lastName: "Brown", ssn: "567-89-0123", payRate: "90000.00" },
];

async function seed() {
  console.log("Clearing existing data...");
  await db.execute(sql`TRUNCATE messages, conversations, pto, pto_accruals, employees CASCADE`);

  console.log("Inserting employees...");
  const insertedEmployees = await db.insert(employees).values(sampleEmployees).returning();

  console.log("Inserting PTO accruals...");
  const accrualData = insertedEmployees.map((emp) => ({
    employeeId: emp.id,
    totalHoursAllotted: "120.00",
    totalHoursRemaining: String((80 + Math.floor(Math.random() * 40)).toFixed(2)),
  }));
  await db.insert(ptoAccruals).values(accrualData).returning();

  console.log("Inserting PTO records...");
  const ptoData = [
    {
      employeeId: insertedEmployees[0].id,
      dateTime: new Date("2026-01-15T09:00:00Z"),
      hoursTaken: "8.00",
    },
    {
      employeeId: insertedEmployees[0].id,
      dateTime: new Date("2026-02-10T09:00:00Z"),
      hoursTaken: "4.00",
    },
    {
      employeeId: insertedEmployees[1].id,
      dateTime: new Date("2026-01-20T09:00:00Z"),
      hoursTaken: "8.00",
    },
    {
      employeeId: insertedEmployees[2].id,
      dateTime: new Date("2026-02-05T09:00:00Z"),
      hoursTaken: "16.00",
    },
  ];
  await db.insert(pto).values(ptoData).returning();

  console.log("Inserting sample conversation...");
  const [conversation] = await db
    .insert(conversations)
    .values({
      employeeId: insertedEmployees[0].id,
      title: "PTO Balance Inquiry",
    })
    .returning();

  await db.insert(messages).values([
    {
      conversationId: conversation.id,
      role: "user",
      content: "How many PTO hours do I have left?",
      status: "complete",
    },
    {
      conversationId: conversation.id,
      role: "assistant",
      content:
        "Based on your records, you currently have PTO hours remaining out of 120.00 hours allotted for the year. You've taken 12 hours of PTO so far.",
      status: "complete",
    },
  ]);

  console.log("Seed complete!");
  console.log(`  - ${insertedEmployees.length} employees`);
  console.log(`  - ${accrualData.length} PTO accruals`);
  console.log(`  - ${ptoData.length} PTO records`);
  console.log(`  - 1 conversation with 2 messages`);

  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
