import type { ReservationMock } from "./reservation.mock";
import { mockPatient } from "./patient.mock";

export class PatientDaoMock {
  async get(id: string): Promise<typeof mockPatient | null> {
    await Promise.resolve();
    return id === "PAT-1" ? mockPatient : null;
  }

  async addReservation(patientId: string, reservation: ReservationMock): Promise<typeof mockPatient | null> {
    await Promise.resolve();

    if (patientId === "PAT-1") {
      mockPatient.rezervace.push(reservation);
      return mockPatient;
    }

    return null;
  }
}