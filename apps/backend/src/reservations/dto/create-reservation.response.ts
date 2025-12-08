export class CreateReservationResponseDto {
  reservation!: {
    id: string;
    code: string;
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
  };

  notificationStatus!: {
    email: 'sent' | 'failed' | 'notRequested';
  };
}