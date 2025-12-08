import { mockProcedure } from "./procedure.mock";

export class ProcedureDaoMock {
  async get(id: string) {
    await Promise.resolve();
    return id === "PROC-1" ? mockProcedure : null;
  }
}