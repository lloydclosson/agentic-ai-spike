import { beforeEach, describe, expect, it } from "vitest";
import { executeGraphQL, truncateAll } from "./setup.js";

describe("Employee CRUD", () => {
  beforeEach(async () => {
    await truncateAll();
  });

  it("creates and queries an employee", async () => {
    const createResult = await executeGraphQL(`
      mutation {
        createEmployee(input: {
          firstName: "Jane"
          lastName: "Smith"
          ssn: "123-45-6789"
          payRate: "75000.00"
        }) {
          id
          firstName
          lastName
          ssn
          payRate
        }
      }
    `);

    expect(createResult.errors).toBeUndefined();
    const created = createResult.data.createEmployee;
    expect(created.firstName).toBe("Jane");
    expect(created.lastName).toBe("Smith");
    expect(created.ssn).toBe("123-45-6789");
    expect(created.payRate).toBe("75000.00");
    expect(created.id).toBeTruthy();

    const queryResult = await executeGraphQL(
      `
      query($id: ID!) {
        employee(id: $id) {
          id
          firstName
          lastName
        }
      }
    `,
      { id: created.id },
    );

    expect(queryResult.data.employee.firstName).toBe("Jane");
  });

  it("lists all employees", async () => {
    await executeGraphQL(`
      mutation {
        createEmployee(input: {
          firstName: "Alice"
          lastName: "Johnson"
          ssn: "111-22-3333"
          payRate: "60000.00"
        }) { id }
      }
    `);

    await executeGraphQL(`
      mutation {
        createEmployee(input: {
          firstName: "Bob"
          lastName: "Williams"
          ssn: "444-55-6666"
          payRate: "70000.00"
        }) { id }
      }
    `);

    const result = await executeGraphQL(`
      query {
        employees {
          id
          firstName
          lastName
        }
      }
    `);

    expect(result.data.employees).toHaveLength(2);
  });

  it("updates an employee", async () => {
    const createResult = await executeGraphQL(`
      mutation {
        createEmployee(input: {
          firstName: "Jane"
          lastName: "Smith"
          ssn: "123-45-6789"
          payRate: "75000.00"
        }) { id }
      }
    `);

    const id = createResult.data.createEmployee.id;

    const updateResult = await executeGraphQL(
      `
      mutation($id: ID!) {
        updateEmployee(id: $id, input: { payRate: "80000.00" }) {
          id
          payRate
          firstName
        }
      }
    `,
      { id },
    );

    expect(updateResult.data.updateEmployee.payRate).toBe("80000.00");
    expect(updateResult.data.updateEmployee.firstName).toBe("Jane");
  });

  it("deletes an employee", async () => {
    const createResult = await executeGraphQL(`
      mutation {
        createEmployee(input: {
          firstName: "Jane"
          lastName: "Smith"
          ssn: "123-45-6789"
          payRate: "75000.00"
        }) { id }
      }
    `);

    const id = createResult.data.createEmployee.id;

    const deleteResult = await executeGraphQL(
      `
      mutation($id: ID!) {
        deleteEmployee(id: $id)
      }
    `,
      { id },
    );

    expect(deleteResult.data.deleteEmployee).toBe(true);

    const queryResult = await executeGraphQL(
      `
      query($id: ID!) {
        employee(id: $id) { id }
      }
    `,
      { id },
    );

    expect(queryResult.data.employee).toBeNull();
  });

  it("returns null for non-existent employee", async () => {
    const result = await executeGraphQL(`
      query {
        employee(id: "00000000-0000-0000-0000-000000000000") { id }
      }
    `);

    expect(result.data.employee).toBeNull();
  });
});
