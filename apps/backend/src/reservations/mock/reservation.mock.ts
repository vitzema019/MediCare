export interface ReservationMock {
  id: string;
  doctorId: string;
  patientId: string;
  departmentId: string;
  procedureId: string;
  slotStart: string;
  slotEnd: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  note?: string;
  code: string;
}

export const mockReservations: ReservationMock[] = [];