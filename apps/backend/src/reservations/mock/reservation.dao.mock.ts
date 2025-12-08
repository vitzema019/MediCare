import { mockReservations, type ReservationMock } from "./reservation.mock";

const reservations: ReservationMock[] = mockReservations;

export class ReservationDaoMock {
  async create(reservation: ReservationMock): Promise<ReservationMock> {
    await Promise.resolve();
    reservations.push(reservation);
    return reservation;
  }

  async existsOverlapping(
    doctorId: string,
    slotStart: Date,
    slotEnd: Date
  ): Promise<boolean> {
    await Promise.resolve();

    return reservations.some((r) => {
      return (
        r.doctorId === doctorId &&
        new Date(r.slotStart) < slotEnd &&
        new Date(r.slotEnd) > slotStart
      );
    });
  }
}