export class SetAvailabilityResponseDto {
  doctor!: {
    id: string;
    jmeno: string;
    prijmeni: string;
    email: string;
    telefon: string;
    specializace: string;
    oddeleniId: string;
    dostupnost: { den: string; od: string; do: string }[];
    aktivni: boolean;
    createdAt: string;
    updatedAt: string;
  };

  availabilitySummary!: {
    daysCount: number;
    slotsCount: number;
  };

  unsupportedKeyList!: string[];
  invalidTypeKeyMap!: Record<string, string>;
  invalidValueKeyMap!: Record<string, string>;
  missingKeyMap!: Record<string, string>;
}
