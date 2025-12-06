export type HealthStatus = { status: 'ok' };

export type DoctorAvailabilitySlot = { den: string; od: string; do: string };

export type Doctor = {
  id: string;
  jmeno: string;
  prijmeni: string;
  email: string;
  telefon: string;
  specializace: string;
  oddeleniId: string;
  dostupnost: DoctorAvailabilitySlot[];
  aktivni: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SetAvailabilityDtoIn = {
  doctorId?: string | null;
  availability: { day: string; from: string; to: string }[];
};

export type SetAvailabilityDtoOut = {
  doctor: Doctor;
  availabilitySummary: { daysCount: number; slotsCount: number };
  unsupportedKeyList: string[];
  invalidTypeKeyMap: Record<string, string>;
  invalidValueKeyMap: Record<string, string>;
  missingKeyMap: Record<string, string>;
};
