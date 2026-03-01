import { beforeEach, describe, expect, it } from "vitest";
import { executeGraphQL, truncateAll } from "./setup.js";

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

describe("PTO Accrual CRUD", () => {
  let employeeId: string;

  beforeEach(async () => {
    await truncateAll();
    employeeId = await createTestEmployee();
  });

  it("creates and queries a PTO accrual", async () => {
    const createResult = await executeGraphQL(
      `
      mutation($employeeId: ID!) {
        createPtoAccrual(input: {
          employeeId: $employeeId
          totalHoursRemaining: "80.00"
          totalHoursAllotted: "120.00"
        }) {
          id
          employeeId
          totalHoursRemaining
          totalHoursAllotted
        }
      }
    `,
      { employeeId },
    );

    expect(createResult.errors).toBeUndefined();
    const created = createResult.data.createPtoAccrual;
    expect(created.totalHoursRemaining).toBe("80.00");
    expect(created.totalHoursAllotted).toBe("120.00");
    expect(created.employeeId).toBe(employeeId);

    const queryResult = await executeGraphQL(
      `
      query($id: ID!) {
        ptoAccrual(id: $id) {
          id
          employee {
            firstName
          }
        }
      }
    `,
      { id: created.id },
    );

    expect(queryResult.data.ptoAccrual.employee.firstName).toBe("Jane");
  });

  it("filters accruals by employeeId", async () => {
    await executeGraphQL(
      `
      mutation($employeeId: ID!) {
        createPtoAccrual(input: {
          employeeId: $employeeId
          totalHoursRemaining: "80.00"
          totalHoursAllotted: "120.00"
        }) { id }
      }
    `,
      { employeeId },
    );

    const result = await executeGraphQL(
      `
      query($employeeId: ID!) {
        ptoAccruals(employeeId: $employeeId) {
          id
          totalHoursRemaining
        }
      }
    `,
      { employeeId },
    );

    expect(result.data.ptoAccruals).toHaveLength(1);
  });

  it("updates a PTO accrual", async () => {
    const createResult = await executeGraphQL(
      `
      mutation($employeeId: ID!) {
        createPtoAccrual(input: {
          employeeId: $employeeId
          totalHoursRemaining: "80.00"
          totalHoursAllotted: "120.00"
        }) { id }
      }
    `,
      { employeeId },
    );

    const id = createResult.data.createPtoAccrual.id;

    const updateResult = await executeGraphQL(
      `
      mutation($id: ID!) {
        updatePtoAccrual(id: $id, input: { totalHoursRemaining: "60.00" }) {
          totalHoursRemaining
          totalHoursAllotted
        }
      }
    `,
      { id },
    );

    expect(updateResult.data.updatePtoAccrual.totalHoursRemaining).toBe("60.00");
    expect(updateResult.data.updatePtoAccrual.totalHoursAllotted).toBe("120.00");
  });

  it("deletes a PTO accrual", async () => {
    const createResult = await executeGraphQL(
      `
      mutation($employeeId: ID!) {
        createPtoAccrual(input: {
          employeeId: $employeeId
          totalHoursRemaining: "80.00"
          totalHoursAllotted: "120.00"
        }) { id }
      }
    `,
      { employeeId },
    );

    const id = createResult.data.createPtoAccrual.id;

    const deleteResult = await executeGraphQL(
      `
      mutation($id: ID!) {
        deletePtoAccrual(id: $id)
      }
    `,
      { id },
    );

    expect(deleteResult.data.deletePtoAccrual).toBe(true);
  });
});

describe("PTO Record CRUD", () => {
  let employeeId: string;

  beforeEach(async () => {
    await truncateAll();
    employeeId = await createTestEmployee();
  });

  it("creates and queries a PTO record", async () => {
    const createResult = await executeGraphQL(
      `
      mutation($employeeId: ID!) {
        createPto(input: {
          employeeId: $employeeId
          dateTime: "2026-03-15T09:00:00.000Z"
          hoursTaken: "8.00"
        }) {
          id
          employeeId
          dateTime
          hoursTaken
        }
      }
    `,
      { employeeId },
    );

    expect(createResult.errors).toBeUndefined();
    const created = createResult.data.createPto;
    expect(created.hoursTaken).toBe("8.00");
    expect(created.employeeId).toBe(employeeId);

    const queryResult = await executeGraphQL(
      `
      query($id: ID!) {
        ptoRecord(id: $id) {
          id
          employee {
            firstName
          }
        }
      }
    `,
      { id: created.id },
    );

    expect(queryResult.data.ptoRecord.employee.firstName).toBe("Jane");
  });

  it("filters PTO records by employeeId", async () => {
    await executeGraphQL(
      `
      mutation($employeeId: ID!) {
        createPto(input: {
          employeeId: $employeeId
          dateTime: "2026-03-15T09:00:00.000Z"
          hoursTaken: "8.00"
        }) { id }
      }
    `,
      { employeeId },
    );

    const result = await executeGraphQL(
      `
      query($employeeId: ID!) {
        ptoRecords(employeeId: $employeeId) {
          id
          hoursTaken
        }
      }
    `,
      { employeeId },
    );

    expect(result.data.ptoRecords).toHaveLength(1);
  });

  it("deletes a PTO record", async () => {
    const createResult = await executeGraphQL(
      `
      mutation($employeeId: ID!) {
        createPto(input: {
          employeeId: $employeeId
          dateTime: "2026-03-15T09:00:00.000Z"
          hoursTaken: "8.00"
        }) { id }
      }
    `,
      { employeeId },
    );

    const id = createResult.data.createPto.id;

    const deleteResult = await executeGraphQL(
      `
      mutation($id: ID!) {
        deletePto(id: $id)
      }
    `,
      { id },
    );

    expect(deleteResult.data.deletePto).toBe(true);
  });

  it("cascades delete from employee to PTO records", async () => {
    await executeGraphQL(
      `
      mutation($employeeId: ID!) {
        createPto(input: {
          employeeId: $employeeId
          dateTime: "2026-03-15T09:00:00.000Z"
          hoursTaken: "8.00"
        }) { id }
      }
    `,
      { employeeId },
    );

    await executeGraphQL(
      `
      mutation($employeeId: ID!) {
        createPtoAccrual(input: {
          employeeId: $employeeId
          totalHoursRemaining: "80.00"
          totalHoursAllotted: "120.00"
        }) { id }
      }
    `,
      { employeeId },
    );

    await executeGraphQL(
      `
      mutation($id: ID!) {
        deleteEmployee(id: $id)
      }
    `,
      { id: employeeId },
    );

    const ptoResult = await executeGraphQL(
      `
      query($employeeId: ID!) {
        ptoRecords(employeeId: $employeeId) { id }
      }
    `,
      { employeeId },
    );

    const accrualResult = await executeGraphQL(
      `
      query($employeeId: ID!) {
        ptoAccruals(employeeId: $employeeId) { id }
      }
    `,
      { employeeId },
    );

    expect(ptoResult.data.ptoRecords).toHaveLength(0);
    expect(accrualResult.data.ptoAccruals).toHaveLength(0);
  });
});
