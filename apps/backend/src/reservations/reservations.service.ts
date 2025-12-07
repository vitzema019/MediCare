import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { CreateReservationResponseDto } from './dto/create-reservation.response';

import { DoctorDaoMock } from './mock/doctor.dao.mock';
import { PatientDaoMock } from './mock/patient.dao.mock';
import { ProcedureDaoMock } from './mock/procedure.dao.mock';
import { DepartmentDaoMock } from './mock/department.dao.mock';
import { ReservationDaoMock } from './mock/reservation.dao.mock';
import type { ReservationMock } from './mock/reservation.mock';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Reservation } from '../entities/reservation.entity';
import { Model } from 'mongoose';

// Později se sem do constructoru doplní DAO služby (DoctorDao, PatientDao, atd.)

@Injectable()
export class ReservationsService {
  constructor(
    private readonly doctorDao: DoctorDaoMock,
    private readonly patientDao: PatientDaoMock,
    private readonly procedureDao: ProcedureDaoMock,
    private readonly departmentDao: DepartmentDaoMock,
    private readonly reservationDao: ReservationDaoMock,
    @InjectModel(Reservation.name) private reservationModel: Model<Reservation>,
  ) { }
  // constructor(
  //   private readonly doctorDao: DoctorDao,
  //   private readonly patientDao: PatientDao,
  //   private readonly reservationDao: ReservationDao,
  //   private readonly departmentDao: DepartmentDao,
  // ) {}

  /**
   * CMD - Implementation - Vytvoření rezervace
   *
   * Tato metoda implementuje flow podle CMD - Application Model:
   * - validace vstupu (část zajišťuje class-validator)
   * - určení pacienta
   * - načtení lékaře, procedury, pacienta, oddělení (TODO: DAO)
   * - business kontroly (délka slotu, dostupnost, kolize)
   * - vytvoření rezervace (TODO: DAO)
   * - odeslání notifikace (TODO)
   */
  async create(
    dto: CreateReservationDto,
    currentUser: { id: string; patientId?: string; },
  ): Promise<CreateReservationResponseDto> {
    // -------------------------------------------------------------------
    // 1) INPUT VALIDATION – unsupported keys (AM 1.2)
    // -------------------------------------------------------------------
    // seznam povolených klíčů podle requestValidationSchema v AM
    const allowedKeys = [
      'doctorId',
      'patientId',
      'procedureId',
      'slotStart',
      'slotEnd',
      'contactEmail',
      'note',
      'notificationChannels',
      'gdprConsent',
      'medicalDataConsent',
      'departmentId',
    ];

    const dtoKeys = Object.keys(dto ?? {});
    const unsupportedKeyList = dtoKeys.filter((k) => !allowedKeys.includes(k));

    if (unsupportedKeyList.length > 0) {
      console.warn('reservation/create – unsupported keys in dto:', unsupportedKeyList);
    }

    // -------------------------------------------------------------------
    // 2) Určení pacienta (AM 2.3)
    // -------------------------------------------------------------------
    const patientId = dto.patientId ?? currentUser.patientId;
    if (!patientId) {
      // v AM by to byl invalidInput, tady to mapujeme na BadRequest
      throw new BadRequestException('patientId is required');
    }

    // -------------------------------------------------------------------
    // 3) Načtení entit přes DAO moxy (AM 2.1, 2.2, 2.3, rozšíření o department)
    // -------------------------------------------------------------------
    const [doctor, patient, procedure, department] = await Promise.all([
      this.doctorDao.get(dto.doctorId),
      this.patientDao.get(patientId),
      this.procedureDao.get(dto.procedureId),
      this.departmentDao.get(dto.departmentId),
    ]);

    if (!doctor) {
      // doctorNotFound
      throw new BadRequestException('Doctor not found');
    }
    if (!patient) {
      // patientNotFound
      throw new BadRequestException('Patient not found');
    }
    if (!procedure) {
      // procedureNotFound
      throw new BadRequestException('Procedure not found');
    }
    if (!department) {
      throw new BadRequestException('Department not found');
    }
    if (!doctor.aktivni) {
      // doctorNotActive
      throw new BadRequestException('Doctor is not active');
    }

    // -------------------------------------------------------------------
    // 4) Kontrola délky slotu (AM 2.5)
    // -------------------------------------------------------------------
    const slotStart = new Date(dto.slotStart);
    const slotEnd = new Date(dto.slotEnd);

    if (isNaN(slotStart.getTime()) || isNaN(slotEnd.getTime())) {
      throw new BadRequestException('Invalid slotStart or slotEnd');
    }

    const diffMinutes =
      (slotEnd.getTime() - slotStart.getTime()) / (1000 * 60);

    const procedureDuration = procedure.duration; // z mockProcedure
    if (diffMinutes !== procedureDuration) {
      // invalidSlotDuration
      throw new BadRequestException(
        `Slot duration ${diffMinutes}min does not match procedure duration ${procedureDuration}min`,
      );
    }

    // -------------------------------------------------------------------
    // 5) Kontrola kolize (slotNotAvailable – AM 2.6)
    // -------------------------------------------------------------------
    const hasOverlap = await this.reservationDao.existsOverlapping(
      doctor.id,
      slotStart,
      slotEnd,
    );
    if (hasOverlap) {
      throw new BadRequestException('Selected slot is already booked');
    }

    // -------------------------------------------------------------------
    // 6) Vytvoření & uložení rezervace (AM 2.7)
    // -------------------------------------------------------------------
    const nowIso = new Date().toISOString();

    const reservation: ReservationMock = {
      id: `RES-${Date.now()}`,
      code: `RES-CODE-${Date.now()}`,
      doctorId: doctor.id,
      patientId: patient.id,
      departmentId: department.id,
      procedureId: procedure.id,
      slotStart: slotStart.toISOString(),
      slotEnd: slotEnd.toISOString(),
      status: 'pending',
      createdAt: nowIso,
      updatedAt: nowIso,
      note: dto.note,
    };

    const saved = await this.reservationDao.create(reservation);

    // mock: přidání rezervace k pacientovi
    await this.patientDao.addReservation(patient.id, saved);

    // -------------------------------------------------------------------
    // 7) Návratová hodnota v duchu AM:
    //    - reservation
    //    - notificationStatus
    //    - validační informace (unsupportedKeyList, invalidTypeKeyMap, ...)
    // -------------------------------------------------------------------
    return {
      reservation: saved,
      notificationStatus: {
        email: 'notRequested', // mock – reálné odeslání notifikace přijde později
      },
      // odpovídá warningu unsupportedKeys (AM 1.2.A.1)
      unsupportedKeyList,
      // prozatím prázdné mapy – reálná typová validace je delegovaná na class-validator
      invalidTypeKeyMap: {},
      invalidValueKeyMap: {},
      missingKeyMap: {},
    } as unknown as CreateReservationResponseDto;
  }

  async updateReservation(
    id: string,
    updateReservationDto: UpdateReservationDto,
  ) {
    const reservation = await this.reservationModel.findOneAndUpdate(
      { _id: id },
      { $set: updateReservationDto },
      { new: true },
    );

    if (!reservation) {
      throw new NotFoundException(`Reservation #${id} not found`);
    }

    return reservation;
  }

  async removeReservation(id: string) {
    await this.reservationModel.findByIdAndDelete(id, { new: true });
  }

}
