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
import { Doctor } from '../entities/doctor.entity';
import { Patient } from '../entities/patient.entity';
import { Procedure } from '../entities/procedure.entity';
import { Department } from '../entities/department.entity';
import { MessagesService } from '../messages/messages.service';
import { PatientCardsService } from '../patient-cards/patient-cards.service';
import { Model, Types } from 'mongoose';

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
    @InjectModel(Doctor.name) private doctorModel: Model<Doctor>,
    @InjectModel(Patient.name) private patientModel: Model<Patient>,
    @InjectModel(Procedure.name) private procedureModel: Model<Procedure>,
    @InjectModel(Department.name) private departmentModel: Model<Department>,
    private readonly messagesService: MessagesService,
    private readonly patientCardsService: PatientCardsService,
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
    // Use real MongoDB Doctor model instead of mock
    const doctorDoc = await this.doctorModel.findById(dto.doctorId).lean();
    if (!doctorDoc) {
      throw new BadRequestException('Doctor not found');
    }
    
    // Convert to format expected by the rest of the code
    const doctor = {
      id: doctorDoc._id.toString(),
      firstName: doctorDoc.firstName,
      lastName: doctorDoc.lastName,
      aktivni: doctorDoc.active,
    };

    // Get patient - try MongoDB first if it's a valid ObjectId, otherwise use mock
    let patient;
    const isPatientObjectId = Types.ObjectId.isValid(patientId) && patientId.length === 24;
    if (isPatientObjectId) {
      // Try to get real patient from MongoDB
      const patientDoc = await this.patientModel.findById(patientId).lean();
      if (patientDoc) {
        patient = {
          id: patientDoc._id.toString(),
          jmeno: patientDoc.firstName,
          prijmeni: patientDoc.lastName,
          email: patientDoc.email,
          telefon: patientDoc.phoneNumber || '',
          rezervace: [],
          aktivni: true,
        };
      }
    }
    
    // Fallback to mock if not found in MongoDB
    if (!patient) {
      patient = await this.patientDao.get(patientId);
    }
    
    if (!patient) {
      throw new BadRequestException('Patient not found');
    }
    
    // Fetch real procedure if ID is a valid ObjectId, otherwise use mock
    let procedure: any;
    const isProcedureObjectId = Types.ObjectId.isValid(dto.procedureId) && dto.procedureId.length === 24;
    if (isProcedureObjectId) {
      const procedureDoc = await this.procedureModel.findById(dto.procedureId).lean();
      if (procedureDoc) {
        procedure = {
          id: procedureDoc._id.toString(),
          name: procedureDoc.name,
          price: procedureDoc.price,
          duration: procedureDoc.duration,
        };
      }
    }
    
    // Fallback to mock if not found in MongoDB
    if (!procedure) {
      procedure = await this.procedureDao.get(dto.procedureId);
    }
    
    if (!procedure) {
      throw new BadRequestException('Procedure not found');
    }
    
    // Fetch real department if ID is a valid ObjectId, otherwise use mock
    let department: any;
    const isDepartmentObjectId = Types.ObjectId.isValid(dto.departmentId) && dto.departmentId.length === 24;
    if (isDepartmentObjectId) {
      const departmentDoc = await this.departmentModel.findById(dto.departmentId).lean();
      if (departmentDoc) {
        department = {
          id: departmentDoc._id.toString(),
          name: departmentDoc.name,
          address: departmentDoc.address,
          phoneNumber: departmentDoc.phoneNumber,
        };
      }
    }
    
    // Fallback to mock if not found in MongoDB
    if (!department) {
      department = await this.departmentDao.get(dto.departmentId);
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
    const hasOverlap = await this.hasOverlappingReservation(
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

    // Save to MongoDB
    // Convert string IDs to ObjectIds for references
    // Note: doctor.id is a valid MongoDB ObjectId, but patient.id and procedure.id can be mock IDs (e.g., "PAT-1", "PROC-1")
    const reservationCode = `RES-CODE-${Date.now()}`;
    
    // Convert doctor ID to ObjectId (it's a valid MongoDB ObjectId from the database)
    // Convert patient ID to ObjectId if it's a valid ObjectId, otherwise keep as string (for mock IDs)
    const patientIdValue = Types.ObjectId.isValid(patient.id) && patient.id.length === 24
      ? new Types.ObjectId(patient.id)
      : patient.id;
    
    const reservationDoc = await this.reservationModel.create({
      doctor: new Types.ObjectId(doctor.id),
      patient: patientIdValue, // Can be ObjectId or string
      procedure: procedure.id, // Keep as string for mock IDs like "PROC-1"
      slotStart: slotStart.toISOString(),
      slotEnd: slotEnd.toISOString(),
      status: 'pending',
      notes: dto.note,
      code: reservationCode,
    });

    // Also save to mock DAO for compatibility
    const reservation: ReservationMock = {
      id: reservationDoc._id.toString(),
      code: reservationDoc.code || reservationCode,
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
    
    // Return MongoDB document format
    const savedReservation = {
      id: reservationDoc._id.toString(),
      code: reservationDoc.code || reservationCode,
      doctorId: reservationDoc.doctor?.toString() || doctor.id,
      patientId: reservationDoc.patient?.toString() || patient.id,
      departmentId: department.id,
      procedureId: reservationDoc.procedure?.toString() || procedure.id,
      slotStart: reservationDoc.slotStart,
      slotEnd: reservationDoc.slotEnd,
      status: reservationDoc.status,
      createdAt: reservationDoc.createdAt ? new Date(reservationDoc.createdAt).toISOString() : nowIso,
      updatedAt: reservationDoc.updatedAt ? new Date(reservationDoc.updatedAt).toISOString() : nowIso,
      note: reservationDoc.notes,
    };

    // -------------------------------------------------------------------
    // 7) Návratová hodnota v duchu AM:
    //    - reservation
    //    - notificationStatus
    //    - validační informace (unsupportedKeyList, invalidTypeKeyMap, ...)
    // -------------------------------------------------------------------
    return {
      reservation: savedReservation,
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

  async findAll(patientId: string) {
    // Filter reservations by patientId
    // Handle both ObjectId and string patient IDs (since patient can be Mixed type)
    const { Types } = await import('mongoose');
    const isObjectId = Types.ObjectId.isValid(patientId) && patientId.length === 24;
    
    const query = isObjectId
      ? { patient: new Types.ObjectId(patientId) }
      : { patient: patientId };
    
    const reservations = await this.reservationModel.find(query).lean().sort({ slotStart: 1 });
    
    // Convert to format expected by frontend
    return reservations.map(res => ({
      id: res._id.toString(),
      code: `RES-CODE-${res._id.toString()}`,
      doctorId: res.doctor?.toString() || '',
      patientId: res.patient?.toString() || '',
      departmentId: '', // Not in schema yet
      procedureId: res.procedure?.toString() || '',
      slotStart: res.slotStart,
      slotEnd: res.slotEnd,
      status: res.status,
      createdAt: res.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: res.updatedAt?.toISOString() || new Date().toISOString(),
      note: res.notes,
    }));
  }

  async findByDoctor(doctorId: string) {
    // Get all reservations for a specific doctor
    const isObjectId = Types.ObjectId.isValid(doctorId) && doctorId.length === 24;

    const query = isObjectId
      ? { doctor: new Types.ObjectId(doctorId) }
      : { doctor: doctorId };

    const reservations = await this.reservationModel.find(query).lean().sort({ slotStart: 1 });

    // Populate patient and procedure info
    const populatedReservations = await Promise.all(
      reservations.map(async (res) => {
        let patientInfo: any = null;
        let procedureInfo: any = null;

        // Get patient info
        if (res.patient) {
          const patientId = res.patient.toString();
          if (Types.ObjectId.isValid(patientId) && patientId.length === 24) {
            const patientDoc = await this.patientModel.findById(patientId).lean();
            if (patientDoc) {
              patientInfo = {
                id: patientDoc._id.toString(),
                firstName: patientDoc.firstName,
                lastName: patientDoc.lastName,
                email: patientDoc.email,
              };
            }
          }
        }

        // Get procedure info
        if (res.procedure) {
          const procedureId = res.procedure.toString();
          if (Types.ObjectId.isValid(procedureId) && procedureId.length === 24) {
            const procedureDoc = await this.procedureModel.findById(procedureId).lean();
            if (procedureDoc) {
              procedureInfo = {
                id: procedureDoc._id.toString(),
                name: procedureDoc.name,
                duration: procedureDoc.duration,
                price: procedureDoc.price,
              };
            }
          }
        }

        return {
          id: res._id.toString(),
          code: res.code || `RES-CODE-${res._id.toString()}`,
          doctorId: res.doctor?.toString() || '',
          patientId: res.patient?.toString() || '',
          patient: patientInfo,
          procedureId: res.procedure?.toString() || '',
          procedure: procedureInfo,
          slotStart: res.slotStart,
          slotEnd: res.slotEnd,
          status: res.status as any,
          createdAt: res.createdAt?.toISOString() || new Date().toISOString(),
          updatedAt: res.updatedAt?.toISOString() || new Date().toISOString(),
          note: res.notes,
          cancellationRequestMessage: res.cancellationRequestMessage,
          rescheduleRequestMessage: res.rescheduleRequestMessage,
          requestedSlotStart: res.requestedSlotStart,
          requestedSlotEnd: res.requestedSlotEnd,
          updateRequestMessage: res.updateRequestMessage,
          requestedDoctorId: res.requestedDoctorId,
          requestedProcedureId: res.requestedProcedureId,
          requestedDepartmentId: res.requestedDepartmentId,
        };
      })
    );

    return populatedReservations;
  }

  async confirmReservation(
    reservationId: string,
    status: 'confirmed' | 'cancelled',
    message?: string,
    doctorId?: string,
  ) {
    const reservation = await this.reservationModel.findById(reservationId);
    if (!reservation) {
      throw new NotFoundException(`Reservation with ID ${reservationId} not found`);
    }

    // Update reservation status
    reservation.status = status;
    await reservation.save();

    // Get patient ID
    const patientId = reservation.patient?.toString();
    if (!patientId || !doctorId) {
      return reservation;
    }

    // If status is 'confirmed', create or update patient card
    if (status === 'confirmed') {
      try {
        // Get or create patient card
        const patientCard = await this.patientCardsService.getOrCreate(doctorId, patientId);
        
        // Get procedure name for visit history
        const procedure = await this.procedureModel.findById(reservation.procedure).lean();
        const procedureName = procedure?.name || 'Unknown Procedure';

        // Add visit to history
        await this.patientCardsService.addVisit(doctorId, patientId, {
          date: new Date(reservation.slotStart),
          procedure: procedureName,
          notes: reservation.notes,
          reservationId: reservation._id.toString(),
        });
      } catch (error) {
        console.error('Failed to create/update patient card:', error);
        // Don't fail the confirmation if patient card creation fails
      }
    }

    // Create a message if provided
    if (message || status) {
      const subject = status === 'confirmed' 
        ? 'Appointment Confirmed' 
        : 'Appointment Declined';
      
      const messageContent = message || 
        (status === 'confirmed' 
          ? 'Your appointment has been confirmed.' 
          : 'Your appointment has been declined.');

      await this.messagesService.create(
        {
          content: messageContent,
          senderType: 'doctor',
          reservationId: reservationId,
          subject: subject,
        },
        doctorId,
        patientId,
      );
    }

    return {
      id: reservation._id.toString(),
      status: reservation.status,
      message: message || 'Status updated',
    };
  }

  async requestCancellation(reservationId: string, message: string) {
    const reservation = await this.reservationModel.findById(reservationId);
    if (!reservation) {
      throw new NotFoundException(`Reservation with ID ${reservationId} not found`);
    }

    if (reservation.status === 'cancelled') {
      throw new BadRequestException('Reservation is already cancelled');
    }

    if (reservation.status === 'cancellation_requested') {
      throw new BadRequestException('Cancellation request already pending');
    }

    reservation.status = 'cancellation_requested';
    reservation.cancellationRequestMessage = message;
    await reservation.save();

    return {
      id: reservation._id.toString(),
      status: reservation.status,
      message: 'Cancellation request submitted',
    };
  }

  async acceptCancellation(reservationId: string, doctorId: string) {
    const reservation = await this.reservationModel.findById(reservationId);
    if (!reservation) {
      throw new NotFoundException(`Reservation with ID ${reservationId} not found`);
    }

    if (reservation.status !== 'cancellation_requested') {
      throw new BadRequestException(`Reservation is not in cancellation_requested status`);
    }

    reservation.status = 'cancelled';
    await reservation.save();

    // Create a message to notify the patient
    if (reservation.patient && reservation.doctor) {
      await this.messagesService.create(
        {
          content: 'Your cancellation request has been accepted. The appointment has been cancelled.',
          senderType: 'doctor',
          reservationId: reservation._id.toString(),
          subject: 'Cancellation Accepted',
        },
        doctorId,
        reservation.patient.toString(),
      );
    }

    return {
      id: reservation._id.toString(),
      status: reservation.status,
      message: 'Cancellation accepted',
    };
  }

  async declineCancellation(reservationId: string, message: string, doctorId: string) {
    const reservation = await this.reservationModel.findById(reservationId);
    if (!reservation) {
      throw new NotFoundException(`Reservation with ID ${reservationId} not found`);
    }

    if (reservation.status !== 'cancellation_requested') {
      throw new BadRequestException(`Reservation is not in cancellation_requested status`);
    }

    // Revert to confirmed status if it was confirmed before, otherwise back to pending
    // We need to track the previous status, but for now, default to confirmed if it exists in history
    // In a real system, you'd store the previous status. For now, we'll default to 'confirmed'
    const previousStatus = 'confirmed'; // Could be enhanced to track previous status
    
    reservation.status = previousStatus;
    reservation.cancellationRequestMessage = undefined;
    await reservation.save();

    // Create a message to notify the patient
    if (reservation.patient && reservation.doctor) {
      await this.messagesService.create(
        {
          content: message || 'Your cancellation request has been declined. The appointment remains scheduled.',
          senderType: 'doctor',
          reservationId: reservation._id.toString(),
          subject: 'Cancellation Declined',
        },
        doctorId,
        reservation.patient.toString(),
      );
    }

    return {
      id: reservation._id.toString(),
      status: reservation.status,
      message: 'Cancellation declined',
    };
  }

  async requestReschedule(
    reservationId: string,
    message: string,
    requestedSlotStart: string,
    requestedSlotEnd: string,
  ) {
    const reservation = await this.reservationModel.findById(reservationId);
    if (!reservation) {
      throw new NotFoundException(`Reservation with ID ${reservationId} not found`);
    }

    if (reservation.status === 'cancelled') {
      throw new BadRequestException('Cannot reschedule a cancelled appointment');
    }

    if (reservation.status === 'reschedule_requested') {
      throw new BadRequestException('Reschedule request already pending');
    }

    // Validate the requested slot
    const newSlotStart = new Date(requestedSlotStart);
    const newSlotEnd = new Date(requestedSlotEnd);

    if (isNaN(newSlotStart.getTime()) || isNaN(newSlotEnd.getTime())) {
      throw new BadRequestException('Invalid slotStart or slotEnd');
    }

    if (newSlotStart >= newSlotEnd) {
      throw new BadRequestException('Slot start must be before slot end');
    }

    // Check for overlapping reservations
    const doctorId = reservation.doctor?.toString() || '';
    if (!Types.ObjectId.isValid(doctorId)) {
      throw new BadRequestException('Doctor ID is invalid');
    }

    const hasOverlap = await this.hasOverlappingReservation(
      doctorId,
      newSlotStart,
      newSlotEnd,
      reservation._id.toString(),
    );
    if (hasOverlap) {
      throw new BadRequestException('Requested slot is already booked');
    }

    reservation.status = 'reschedule_requested';
    reservation.rescheduleRequestMessage = message;
    reservation.requestedSlotStart = requestedSlotStart;
    reservation.requestedSlotEnd = requestedSlotEnd;
    await reservation.save();

    return {
      id: reservation._id.toString(),
      status: reservation.status,
      message: 'Reschedule request submitted',
    };
  }

  async acceptReschedule(reservationId: string, doctorId: string) {
    const reservation = await this.reservationModel.findById(reservationId);
    if (!reservation) {
      throw new NotFoundException(`Reservation with ID ${reservationId} not found`);
    }

    if (reservation.status !== 'reschedule_requested') {
      throw new BadRequestException(`Reservation is not in reschedule_requested status`);
    }

    if (!reservation.requestedSlotStart || !reservation.requestedSlotEnd) {
      throw new BadRequestException('Reschedule request missing slot information');
    }

    // Update to the requested slot
    reservation.slotStart = reservation.requestedSlotStart;
    reservation.slotEnd = reservation.requestedSlotEnd;
    reservation.status = 'confirmed'; // Reset to confirmed after reschedule
    reservation.rescheduleRequestMessage = undefined;
    reservation.requestedSlotStart = undefined;
    reservation.requestedSlotEnd = undefined;
    await reservation.save();

    // Add visit to patient card if confirmed
    const patientId = reservation.patient?.toString();
    if (patientId) {
      try {
        const procedure = await this.procedureModel.findById(reservation.procedure).lean();
        const procedureName = procedure?.name || 'Unknown Procedure';
        
        await this.patientCardsService.addVisit(doctorId, patientId, {
          date: new Date(reservation.slotStart),
          procedure: procedureName,
          notes: reservation.notes,
          reservationId: reservation._id.toString(),
        });
      } catch (error) {
        console.error('Failed to add visit to patient card:', error);
      }
    }

    // Create a message to notify the patient
    if (reservation.patient && reservation.doctor) {
      await this.messagesService.create(
        {
          content: 'Your reschedule request has been accepted. The appointment has been moved to the requested time.',
          senderType: 'doctor',
          reservationId: reservation._id.toString(),
          subject: 'Reschedule Accepted',
        },
        doctorId,
        reservation.patient.toString(),
      );
    }

    return {
      id: reservation._id.toString(),
      status: reservation.status,
      message: 'Reschedule accepted',
    };
  }

  async declineReschedule(reservationId: string, message: string, doctorId: string) {
    const reservation = await this.reservationModel.findById(reservationId);
    if (!reservation) {
      throw new NotFoundException(`Reservation with ID ${reservationId} not found`);
    }

    if (reservation.status !== 'reschedule_requested') {
      throw new BadRequestException(`Reservation is not in reschedule_requested status`);
    }

    // Revert to previous status (confirmed or pending)
    const previousStatus = reservation.status === 'reschedule_requested' 
      ? 'confirmed' 
      : reservation.status;
    
    reservation.status = previousStatus;
    reservation.rescheduleRequestMessage = undefined;
    reservation.requestedSlotStart = undefined;
    reservation.requestedSlotEnd = undefined;
    await reservation.save();

    // Create a message to notify the patient
    if (reservation.patient && reservation.doctor) {
      await this.messagesService.create(
        {
          content: message || 'Your reschedule request has been declined. The appointment remains at the original time.',
          senderType: 'doctor',
          reservationId: reservation._id.toString(),
          subject: 'Reschedule Declined',
        },
        doctorId,
        reservation.patient.toString(),
      );
    }

    return {
      id: reservation._id.toString(),
      status: reservation.status,
      message: 'Reschedule declined',
    };
  }

  async requestUpdate(
    reservationId: string,
    message: string,
    requestedSlotStart?: string,
    requestedSlotEnd?: string,
    requestedDoctorId?: string,
    requestedProcedureId?: string,
    requestedDepartmentId?: string,
  ) {
    const reservation = await this.reservationModel.findById(reservationId);
    if (!reservation) {
      throw new NotFoundException(`Reservation with ID ${reservationId} not found`);
    }

    if (reservation.status === 'cancelled') {
      throw new BadRequestException('Cannot update a cancelled appointment');
    }

    if (reservation.status === 'update_requested') {
      throw new BadRequestException('Update request already pending');
    }

    // Validate requested slot if provided
    if (requestedSlotStart && requestedSlotEnd) {
      const newSlotStart = new Date(requestedSlotStart);
      const newSlotEnd = new Date(requestedSlotEnd);

      if (isNaN(newSlotStart.getTime()) || isNaN(newSlotEnd.getTime())) {
        throw new BadRequestException('Invalid slotStart or slotEnd');
      }

      if (newSlotStart >= newSlotEnd) {
        throw new BadRequestException('Slot start must be before slot end');
      }

      // Check for overlapping reservations (excluding current reservation)
      const hasOverlap = await this.reservationModel.findOne({
        doctor: reservation.doctor,
        _id: { $ne: reservation._id },
        $or: [
          {
            slotStart: { $lt: newSlotEnd.toISOString() },
            slotEnd: { $gt: newSlotStart.toISOString() },
          },
        ],
        status: { $nin: ['cancelled'] },
      });

      if (hasOverlap) {
        throw new BadRequestException('Requested slot is already booked');
      }
    }

    reservation.status = 'update_requested';
    reservation.updateRequestMessage = message;
    if (requestedSlotStart) reservation.requestedSlotStart = requestedSlotStart;
    if (requestedSlotEnd) reservation.requestedSlotEnd = requestedSlotEnd;
    if (requestedDoctorId) reservation.requestedDoctorId = requestedDoctorId;
    if (requestedProcedureId) reservation.requestedProcedureId = requestedProcedureId;
    if (requestedDepartmentId) reservation.requestedDepartmentId = requestedDepartmentId;
    await reservation.save();

    // Return the updated reservation with all fields
    const updatedReservation = await this.reservationModel.findById(reservation._id).lean();
    if (!updatedReservation) {
      throw new NotFoundException(`Reservation with ID ${reservation._id} not found after update`);
    }

    // Populate patient and procedure info
    let patientInfo: any = null;
    let procedureInfo: any = null;

    if (updatedReservation.patient) {
      const patientId = updatedReservation.patient.toString();
      if (Types.ObjectId.isValid(patientId) && patientId.length === 24) {
        const patientDoc = await this.patientModel.findById(patientId).lean();
        if (patientDoc) {
          patientInfo = {
            id: patientDoc._id.toString(),
            firstName: patientDoc.firstName,
            lastName: patientDoc.lastName,
            email: patientDoc.email,
          };
        }
      }
    }

    if (updatedReservation.procedure) {
      const procedureId = updatedReservation.procedure.toString();
      if (Types.ObjectId.isValid(procedureId) && procedureId.length === 24) {
        const procedureDoc = await this.procedureModel.findById(procedureId).lean();
        if (procedureDoc) {
          procedureInfo = {
            id: procedureDoc._id.toString(),
            name: procedureDoc.name,
            duration: procedureDoc.duration,
            price: procedureDoc.price,
          };
        }
      }
    }

    return {
      id: updatedReservation._id.toString(),
      code: updatedReservation.code || `RES-CODE-${updatedReservation._id.toString()}`,
      doctorId: updatedReservation.doctor?.toString() || '',
      patientId: updatedReservation.patient?.toString() || '',
      patient: patientInfo,
      procedureId: updatedReservation.procedure?.toString() || '',
      procedure: procedureInfo,
      slotStart: updatedReservation.slotStart,
      slotEnd: updatedReservation.slotEnd,
      status: updatedReservation.status as any,
      createdAt: updatedReservation.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: updatedReservation.updatedAt?.toISOString() || new Date().toISOString(),
      note: updatedReservation.notes,
      cancellationRequestMessage: updatedReservation.cancellationRequestMessage,
      rescheduleRequestMessage: updatedReservation.rescheduleRequestMessage,
      requestedSlotStart: updatedReservation.requestedSlotStart,
      requestedSlotEnd: updatedReservation.requestedSlotEnd,
      updateRequestMessage: updatedReservation.updateRequestMessage,
      requestedDoctorId: updatedReservation.requestedDoctorId,
      requestedProcedureId: updatedReservation.requestedProcedureId,
      requestedDepartmentId: updatedReservation.requestedDepartmentId,
    };
  }

  async acceptUpdate(reservationId: string, doctorId: string) {
    const reservation = await this.reservationModel.findById(reservationId);
    if (!reservation) {
      throw new NotFoundException(`Reservation with ID ${reservationId} not found`);
    }

    if (reservation.status !== 'update_requested') {
      throw new BadRequestException(`Reservation is not in update_requested status`);
    }

    // Apply requested changes
    if (reservation.requestedSlotStart && reservation.requestedSlotEnd) {
      reservation.slotStart = reservation.requestedSlotStart;
      reservation.slotEnd = reservation.requestedSlotEnd;
    }
    if (reservation.requestedDoctorId) {
      reservation.doctor = new Types.ObjectId(reservation.requestedDoctorId) as any;
    }
    if (reservation.requestedProcedureId) {
      reservation.procedure = new Types.ObjectId(reservation.requestedProcedureId) as any;
    }

    // Reset to confirmed status after update
    const originalDoctorId = reservation.doctor?.toString();
    reservation.status = 'confirmed';
    reservation.updateRequestMessage = undefined;
    reservation.requestedSlotStart = undefined;
    reservation.requestedSlotEnd = undefined;
    reservation.requestedDoctorId = undefined;
    reservation.requestedProcedureId = undefined;
    reservation.requestedDepartmentId = undefined;
    await reservation.save();

    // Add visit to patient card if confirmed (use updated doctor ID if changed)
    const finalDoctorId = reservation.doctor?.toString() || originalDoctorId || doctorId;
    const patientId = reservation.patient?.toString();
    if (patientId && finalDoctorId) {
      try {
        const procedure = await this.procedureModel.findById(reservation.procedure).lean();
        const procedureName = procedure?.name || 'Unknown Procedure';
        
        await this.patientCardsService.addVisit(finalDoctorId, patientId, {
          date: new Date(reservation.slotStart),
          procedure: procedureName,
          notes: reservation.notes,
          reservationId: reservation._id.toString(),
        });
      } catch (error) {
        console.error('Failed to add visit to patient card:', error);
      }
    }

    // Create a message to notify the patient
    if (reservation.patient && reservation.doctor) {
      await this.messagesService.create(
        {
          content: 'Your appointment update request has been accepted. The appointment has been updated.',
          senderType: 'doctor',
          reservationId: reservation._id.toString(),
          subject: 'Appointment Update Accepted',
        },
        finalDoctorId || doctorId,
        reservation.patient.toString(),
      );
    }

    return {
      id: reservation._id.toString(),
      status: reservation.status,
      message: 'Update accepted',
    };
  }

  async declineUpdate(reservationId: string, message: string, doctorId: string) {
    const reservation = await this.reservationModel.findById(reservationId);
    if (!reservation) {
      throw new NotFoundException(`Reservation with ID ${reservationId} not found`);
    }

    if (reservation.status !== 'update_requested') {
      throw new BadRequestException(`Reservation is not in update_requested status`);
    }

    // Revert to previous status (confirmed or pending)
    const previousStatus = reservation.status === 'update_requested' 
      ? 'confirmed' 
      : reservation.status;
    
    reservation.status = previousStatus;
    reservation.updateRequestMessage = undefined;
    reservation.requestedSlotStart = undefined;
    reservation.requestedSlotEnd = undefined;
    reservation.requestedDoctorId = undefined;
    reservation.requestedProcedureId = undefined;
    reservation.requestedDepartmentId = undefined;
    await reservation.save();

    // Create a message to notify the patient
    if (reservation.patient && reservation.doctor) {
      await this.messagesService.create(
        {
          content: message || 'Your appointment update request has been declined. The appointment remains unchanged.',
          senderType: 'doctor',
          reservationId: reservation._id.toString(),
          subject: 'Appointment Update Declined',
        },
        doctorId,
        reservation.patient.toString(),
      );
    }

    return {
      id: reservation._id.toString(),
      status: reservation.status,
      message: 'Update declined',
    };
  }

  private async hasOverlappingReservation(
    doctorId: string,
    slotStart: Date,
    slotEnd: Date,
    excludeReservationId?: string,
  ): Promise<boolean> {
    const query: Record<string, any> = {
      doctor: new Types.ObjectId(doctorId),
      status: { $ne: 'cancelled' },
      slotStart: { $lt: slotEnd.toISOString() },
      slotEnd: { $gt: slotStart.toISOString() },
    };

    if (excludeReservationId && Types.ObjectId.isValid(excludeReservationId)) {
      query._id = { $ne: new Types.ObjectId(excludeReservationId) };
    }

    const exists = await this.reservationModel.exists(query);
    return Boolean(exists);
  }

}
