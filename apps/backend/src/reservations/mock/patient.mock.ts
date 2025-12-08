import type { ReservationMock } from "./reservation.mock";

export interface PatientMock {
  id: string;
  jmeno: string;
  prijmeni: string;
  email: string;
  telefon: string;
  rezervace: ReservationMock[];
}

export const mockPatient: PatientMock = {
  id: "PAT-1",
  jmeno: "Test",
  prijmeni: "Pacient",
  email: "test.pacient@example.com",
  telefon: "+420123456789",
  rezervace: [],
};