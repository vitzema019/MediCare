import { mockDepartment } from "./department.mock";

export class DepartmentDaoMock {
  async get(id: string) {
    await Promise.resolve();
    return id === "DEP-1" ? mockDepartment : null;
  }
}