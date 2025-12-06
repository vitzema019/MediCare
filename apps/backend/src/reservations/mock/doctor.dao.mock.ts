import { mockDoctor } from "./doctor.mock";

export class DoctorDaoMock {
  async get(id: string) {
    // Dummy await — kvůli ESLint require-await
    await Promise.resolve();

    return id === "DOC-1" ? mockDoctor : null;
  }

  async setAvailability(
    id: string,
    dostupnost: { den: string; od: string; do: string }[],
  ) {
    await Promise.resolve();

    if (id !== mockDoctor.id) {
      return null;
    }

    mockDoctor.dostupnost = dostupnost;
    mockDoctor.updatedAt = new Date().toISOString();

    return mockDoctor;
  }
}
