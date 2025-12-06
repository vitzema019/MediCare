import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { DoctorDaoMock } from '../reservations/mock/doctor.dao.mock';
import { SetAvailabilityDto } from './dto/set-availability.dto';
import type { Doctor, SetAvailabilityDtoOut } from '@shared/types';

type CurrentUser = { id: string; doctorId?: string; roles?: string[] };

@Injectable()
export class DoctorsService {
  constructor(private readonly doctorDao: DoctorDaoMock) {}

  /**
   * CMD - Implementation - doctor/setAvailability
   *
   * - validace vstupu (unsupported keys)
   * - určení lékaře + kontrola aktivního stavu a oprávnění
   * - business validace dostupnosti (formát času, rozsahy, překryvy)
   * - uložení dostupnosti a návrat dtoOut
   */
  async setAvailability(
    dto: SetAvailabilityDto,
    currentUser: CurrentUser,
  ): Promise<SetAvailabilityDtoOut> {
    const allowedKeys = ['doctorId', 'availability'];
    const allowedSlotKeys = ['day', 'from', 'to'];

    const dtoKeys = Object.keys(dto ?? {});
    const unsupportedKeyList = dtoKeys.filter((k) => !allowedKeys.includes(k));

    if (Array.isArray(dto.availability)) {
      dto.availability.forEach((slot) => {
        const slotKeys = Object.keys(slot ?? {});
        slotKeys.forEach((k) => {
          if (!allowedSlotKeys.includes(k) && !unsupportedKeyList.includes(k)) {
            unsupportedKeyList.push(k);
          }
        });
      });
    }

    if (unsupportedKeyList.length > 0) {
      console.warn('doctor/setAvailability – unsupported keys:', unsupportedKeyList);
    }

    const invalidTypeKeyMap: Record<string, string> = {};
    const invalidValueKeyMap: Record<string, string> = {};
    const missingKeyMap: Record<string, string> = {};

    // doctorId resolve
    const doctorId = dto.doctorId ?? currentUser.doctorId;
    if (!doctorId) {
      throw new BadRequestException({
        message: 'doctorId is required',
        code: 'invalidInput',
        invalidTypeKeyMap,
        invalidValueKeyMap,
        missingKeyMap: { doctorId: 'doctorId is required' },
      });
    }

    // availability presence
    if (!dto.availability || dto.availability.length === 0) {
      throw new BadRequestException({
        message: 'Availability list cannot be empty',
        code: 'emptyAvailability',
      });
    }

    // load doctor
    const doctor = (await this.doctorDao.get(doctorId)) as Doctor | null;
    if (!doctor) {
      throw new BadRequestException({
        message: 'Doctor not found',
        code: 'doctorNotFound',
        doctorId,
      });
    }

    if (doctor.aktivni !== true) {
      throw new BadRequestException({
        message: 'Doctor is not active',
        code: 'doctorNotActive',
        doctorId,
      });
    }

    // simple authorization: only same doctor or admin role
    const isAdmin = currentUser.roles?.includes('admin');
    if (currentUser.doctorId !== doctorId && !isAdmin) {
      throw new ForbiddenException({
        message: 'Unauthorized to change availability',
        code: 'unauthorized',
        user: currentUser.id,
        doctorId,
      });
    }

    // business validation
    const parsedByDay: Record<
      string,
      { from: number; to: number; rawFrom: string; rawTo: string }[]
    > = {};

    const parseTime = (value: string): number | null => {
      const match = /^(\d{2}):(\d{2})$/.exec(value);
      if (!match) return null;
      const hours = Number(match[1]);
      const minutes = Number(match[2]);
      if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        return null;
      }
      return hours * 60 + minutes;
    };

    for (const slot of dto.availability) {
      const day = slot.day;
      const fromMinutes = parseTime(slot.from);
      const toMinutes = parseTime(slot.to);

      if (fromMinutes === null || toMinutes === null || fromMinutes >= toMinutes) {
        throw new BadRequestException({
          message: 'Invalid availability range',
          code: 'invalidAvailabilityRange',
          day: slot.day,
          from: slot.from,
          to: slot.to,
        });
      }

      if (!parsedByDay[day]) {
        parsedByDay[day] = [];
      }
      parsedByDay[day].push({
        from: fromMinutes,
        to: toMinutes,
        rawFrom: slot.from,
        rawTo: slot.to,
      });
    }

    // overlaps per day
    for (const [day, slots] of Object.entries(parsedByDay)) {
      const sorted = [...slots].sort((a, b) => a.from - b.from);
      for (let i = 1; i < sorted.length; i += 1) {
        const prev = sorted[i - 1];
        const curr = sorted[i];
        if (curr.from < prev.to) {
          throw new BadRequestException({
            message: 'Availability slots overlap',
            code: 'availabilityOverlaps',
            day,
          });
        }
      }
    }

    const novaDostupnost = dto.availability.map((slot) => ({
      den: slot.day,
      od: slot.from,
      do: slot.to,
    }));

    const updatedDoctor = (await this.doctorDao.setAvailability(
      doctorId,
      novaDostupnost,
    )) as Doctor | null;

    if (!updatedDoctor) {
      throw new BadRequestException({
        message: 'Doctor not found',
        code: 'doctorNotFound',
        doctorId,
      });
    }

    const availabilitySummary = {
      daysCount: new Set(novaDostupnost.map((s) => s.den)).size,
      slotsCount: novaDostupnost.length,
    };

    return {
      doctor: updatedDoctor,
      availabilitySummary,
      unsupportedKeyList,
      invalidTypeKeyMap,
      invalidValueKeyMap,
      missingKeyMap,
    };
  }
}
