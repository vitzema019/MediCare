# Implementace commandu `doctor/setAvailability`

Shrnutí zadání z Application modelu a doporučený postup implementace v kontextu současného backendu (viz ukázková implementace `reservations.create` v `apps/backend/src/reservations/reservations.service.ts`).

## Endpoint
- `POST /doctor/setAvailability`
- Role/profil: přihlášený lékař (případně admin dle oprávnění).
- Účel: nastavit/aktualizovat dostupnost lékaře (ordinační hodiny) na entitě `Doctor`.

## DTOIn
```ts
// apps/backend/src/doctors/dto/set-availability.dto.ts
export class SetAvailabilityDto {
  @IsOptional()
  @IsString()
  doctorId?: string; // pokud chybí, použije se z identity uživatele

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AvailabilitySlotDto)
  availability!: AvailabilitySlotDto[];
}

class AvailabilitySlotDto {
  @IsEnum(['monday','tuesday','wednesday','thursday','friday','saturday','sunday'])
  day!: string;

  @Matches(/^\d{2}:\d{2}$/)
  from!: string; // HH:mm

  @Matches(/^\d{2}:\d{2}$/)
  to!: string;   // HH:mm
}
```
- Stejně jako u `reservations.create` přidat manuální detekci `unsupportedKeyList` (seznam povolených klíčů: `doctorId`, `availability`, `availability[].day`, `availability[].from`, `availability[].to`), warning log a props v response.
- Business validace mimo `class-validator`: prázdný seznam, parsování času, `from < to`, kontrola překryvů.

## DTOOut
```ts
// apps/backend/src/doctors/dto/set-availability.response.ts
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
    createdAt: string; // ISO date-time
    updatedAt: string; // ISO date-time
  };
  availabilitySummary!: { daysCount: number; slotsCount: number };
  unsupportedKeyList!: string[];
  invalidTypeKeyMap!: Record<string, string>;
  invalidValueKeyMap!: Record<string, string>;
  missingKeyMap!: Record<string, string>;
}
```
- `availabilitySummary`: `daysCount` = počet unikátních dnů, `slotsCount` = počet všech slotů.

## Business flow (navázaný na strukturu v `reservations.service.ts`)
1) **Validace vstupu**
   - `class-validator` + manuální `unsupportedKeyList`.
   - Pokud validace selže: error `invalidInput` (BadRequest).
2) **Určení a načtení lékaře**
   - `const doctorId = dto.doctorId ?? currentUser.doctorId;` – pokud chybí → `invalidInput`.
   - `DoctorDao.get({ id: doctorId })`; pokud `null` → `doctorNotFound`.
   - Kontrola `aktivni === true` → jinak `doctorNotActive`.
   - Oprávnění: ověřit, že `currentUser.doctorId === doctorId` nebo má roli admin (prozatím mock/placeholder check, dokud nebude auth).
3) **Business validace dostupnosti**
   - Prázdný seznam → `emptyAvailability`.
   - Parsování času na minuty od půlnoci; pokud neplatné nebo `from >= to` → `invalidAvailabilityRange` s parametry `day/from/to`.
   - Pro každý den setřídit sloty podle `from`; jakýkoli překryv → `availabilityOverlaps` s parametrem `day`.
4) **Uložení**
   - Transformace slotů `{ day, from, to }` → `{ den, od, do }` pro entitu `Doctor`.
   - Aktualizace `updatedAt = new Date().toISOString()`.
   - Persistovat přes DAO (`DoctorDaoMock.setAvailability(doctorId, novaDostupnost)`; v reálu `update`). V mocku stačí mutovat `mockDoctor`.
5) **Response**
   - Vrátit aktualizovaného lékaře (po uložení) + `availabilitySummary`.
   - Přibalit validační struktury (`unsupportedKeyList`, `invalidTypeKeyMap`, `invalidValueKeyMap`, `missingKeyMap`), obdobně jako v `reservations.create`.

## Dopady na kód / struktura
- Nový modul `doctors` (analogicky k `reservations`):
  - `doctors.controller.ts` s `@Post('doctor/setAvailability')`.
  - `doctors.service.ts` s metodou `setAvailability(dto, currentUser)`.
  - `dto` složka se dvěma soubory uvedenými výše.
- AppModule: importovat `DoctorsModule`.
- Mocks/DAO:
  - Rozšířit `DoctorDaoMock` o `setAvailability` (mutace + update `updatedAt`), případně `update`.
  - `doctor.mock.ts` doplnit pole požadovaná ve `dtoOut` (`email`, `telefon`, `specializace`, `oddeleniId`, `createdAt`, `updatedAt`, `dostupnost` s anglickými dny nebo mapování).
- Přístup k aktuálnímu uživateli: zatím stejně jako v `reservations.controller.ts` použít mock `currentUser` s `doctorId`, později nahradit auth guardem/decoratorem.

## Otevřené otázky / volby
- Jazyk dní: vstup očekává anglické `day`, entita má `den`; je potřeba sjednotit mock data (přejít na `monday..sunday`) nebo doplnit mapu překladů při zápisu. **V implementaci mocků je sjednoceno na anglické dny.**
- Autorizace: zatím jednoduchý check na shodu `doctorId`; jakmile bude k dispozici role admin, doplnit.
- Error mapping: v Nestu vrátit `BadRequestException`/`ForbiddenException` s message + kód z Application modelu, nebo prozatím reuse `BadRequest` jako v `reservations.create`?

## Inspirace z existujícího kódu
- Struktura validací, warning `unsupportedKeyList` a způsob sestavení response → `apps/backend/src/reservations/reservations.service.ts`.
- Zapojení mock DAO do modulu → `apps/backend/src/reservations/reservations.module.ts`.
