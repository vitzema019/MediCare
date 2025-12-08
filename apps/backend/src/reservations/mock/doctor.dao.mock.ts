import { mockDoctor } from "./doctor.mock";

export class DoctorDaoMock {
  async get(id: string) {
    // Dummy await — kvůli ESLint require-await
    await Promise.resolve();

    return id === "DOC-1" ? mockDoctor : null;
  }
}