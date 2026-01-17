import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcrypt';
import { Clinic } from '../entities/clinic.entity';
import { ClinicAdmin } from '../entities/clinic-admin.entity';
import { Department } from '../entities/department.entity';
import { Doctor, DaySchedule } from '../entities/doctor.entity';
import { Message } from '../entities/message.entity';
import { Patient } from '../entities/patient.entity';
import { PatientCard } from '../entities/patient-card.entity';
import { Procedure } from '../entities/procedure.entity';
import { Reservation } from '../entities/reservation.entity';
import { Team } from '../entities/team.entity';
import { TimeSlot } from '../entities/timeslot.entity';

const DEFAULT_PASSWORD = 'admin123';
const SALT_ROUNDS = 10;

const envCandidates = [
  path.resolve(__dirname, '.env'),
  path.resolve(__dirname, '../../../.env'),
  path.resolve(__dirname, '../../../../.env'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../../.env'),
];

for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

type DoctorSeed = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  specialty?: string;
  department?: string;
  phoneNumber?: string;
  licenseNumber?: string;
  availableHours?: DaySchedule[];
  active?: boolean;
};

type PatientSeed = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  address?: string;
};

function buildAvailableHours(
  startTime: string,
  endTime: string,
  enabledDays: number[],
): DaySchedule[] {
  return enabledDays.map((dayOfWeek) => ({
    dayOfWeek,
    startTime,
    endTime,
    enabled: true,
  }));
}

function slotForNextDay(
  dayOffset: number,
  hour: number,
  minute: number,
  durationMinutes: number,
) {
  const base = new Date();
  base.setUTCDate(base.getUTCDate() + dayOffset);
  base.setUTCHours(0, 0, 0, 0);

  const start = new Date(base);
  start.setUTCHours(hour, minute, 0, 0);

  const end = new Date(start);
  end.setUTCMinutes(end.getUTCMinutes() + durationMinutes);

  return { start, end };
}

async function ensureDepartment(
  departmentModel: Model<Department>,
  seed: { name: string; address: string; phoneNumber: string },
) {
  const existing = await departmentModel.findOne({ name: seed.name });
  if (existing) {
    const update: Partial<Department> = {};
    if (!existing.address && seed.address) update.address = seed.address;
    if (!existing.phoneNumber && seed.phoneNumber) update.phoneNumber = seed.phoneNumber;

    if (Object.keys(update).length > 0) {
      await departmentModel.updateOne({ _id: existing._id }, { $set: update });
      const updated = await departmentModel.findById(existing._id);
      console.log(`~ Department updated: ${seed.name}`);
      return updated as Department;
    }

    console.log(`= Department exists: ${seed.name}`);
    return existing;
  }

  const created = await departmentModel.create(seed);
  console.log(`+ Department created: ${seed.name}`);
  return created;
}

async function ensureProcedure(
  procedureModel: Model<Procedure>,
  seed: { name: string; price: number; duration: number },
) {
  const existing = await procedureModel.findOne({ name: seed.name });
  if (existing) {
    const update: Partial<Procedure> = {};
    if (existing.price === undefined && seed.price !== undefined) {
      update.price = seed.price;
    }
    if (existing.duration === undefined && seed.duration !== undefined) {
      update.duration = seed.duration;
    }

    if (Object.keys(update).length > 0) {
      await procedureModel.updateOne({ _id: existing._id }, { $set: update });
      const updated = await procedureModel.findById(existing._id);
      console.log(`~ Procedure updated: ${seed.name}`);
      return updated as Procedure;
    }

    console.log(`= Procedure exists: ${seed.name}`);
    return existing;
  }

  const created = await procedureModel.create(seed);
  console.log(`+ Procedure created: ${seed.name}`);
  return created;
}

async function ensureClinic(
  clinicModel: Model<Clinic>,
  seed: {
    name: string;
    address?: string;
    phoneNumber?: string;
    email?: string;
    description?: string;
    active?: boolean;
  },
) {
  const existing = await clinicModel.findOne({ name: seed.name });
  if (existing) {
    console.log(`= Clinic exists: ${seed.name}`);
    return existing;
  }

  const created = await clinicModel.create(seed);
  console.log(`+ Clinic created: ${seed.name}`);
  return created;
}

async function ensureClinicAdmin(
  clinicAdminModel: Model<ClinicAdmin>,
  clinicId: Types.ObjectId,
  seed: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    active?: boolean;
    role?: string;
  },
) {
  let admin = await clinicAdminModel.findOne({ email: seed.email });
  if (!admin) {
    admin = await clinicAdminModel.create({
      ...seed,
      clinic: clinicId,
    });
    console.log(`+ Clinic admin created: ${seed.email}`);
    return admin;
  }

  const update: Partial<ClinicAdmin> = {};
  if (!admin.clinic) {
    update.clinic = clinicId as any;
  }
  if (!admin.role && seed.role) {
    update.role = seed.role;
  }
  if (admin.active === undefined && seed.active !== undefined) {
    update.active = seed.active;
  }
  if (!admin.password) {
    update.password = seed.password as any;
  }

  if (Object.keys(update).length > 0) {
    await clinicAdminModel.updateOne({ _id: admin._id }, { $set: update });
    admin = await clinicAdminModel.findById(admin._id);
    console.log(`~ Clinic admin updated: ${seed.email}`);
  } else {
    console.log(`= Clinic admin exists: ${seed.email}`);
  }

  return admin as ClinicAdmin;
}

async function ensureDoctor(
  doctorModel: Model<Doctor>,
  seed: DoctorSeed,
) {
  let doctor = await doctorModel.findOne({ email: seed.email });
  if (!doctor) {
    doctor = await doctorModel.findOne({
      firstName: seed.firstName,
      lastName: seed.lastName,
    });
  }

  if (!doctor) {
    const created = await doctorModel.create({
      ...seed,
      active: seed.active !== undefined ? seed.active : true,
    });
    console.log(`+ Doctor created: ${seed.firstName} ${seed.lastName}`);
    return created;
  }

  const update: Partial<Doctor> = {};
  if (!doctor.email) update.email = seed.email;
  if (!doctor.password) update.password = seed.password;
  if (!doctor.specialty && seed.specialty) update.specialty = seed.specialty;
  if (!doctor.department && seed.department) update.department = seed.department;
  if (!doctor.phoneNumber && seed.phoneNumber) update.phoneNumber = seed.phoneNumber;
  if (!doctor.licenseNumber && seed.licenseNumber) update.licenseNumber = seed.licenseNumber;
  if (
    (!doctor.availableHours || doctor.availableHours.length === 0) &&
    seed.availableHours
  ) {
    update.availableHours = seed.availableHours;
  }
  if (doctor.active === undefined && seed.active !== undefined) {
    update.active = seed.active;
  }

  if (Object.keys(update).length > 0) {
    await doctorModel.updateOne({ _id: doctor._id }, { $set: update });
    doctor = await doctorModel.findById(doctor._id);
    console.log(`~ Doctor updated: ${seed.firstName} ${seed.lastName}`);
  } else {
    console.log(`= Doctor exists: ${seed.firstName} ${seed.lastName}`);
  }

  return doctor as Doctor;
}

async function ensurePatient(
  patientModel: Model<Patient>,
  seed: PatientSeed,
) {
  let patient = await patientModel.findOne({ email: seed.email });
  if (!patient) {
    patient = await patientModel.findOne({
      firstName: seed.firstName,
      lastName: seed.lastName,
    });
  }

  if (!patient) {
    const created = await patientModel.create(seed);
    console.log(`+ Patient created: ${seed.firstName} ${seed.lastName}`);
    return created;
  }

  const update: Partial<Patient> = {};
  if (!patient.email) update.email = seed.email;
  if (!patient.password) update.password = seed.password;
  if (!patient.phoneNumber && seed.phoneNumber) update.phoneNumber = seed.phoneNumber;
  if (!patient.address && seed.address) update.address = seed.address;

  if (Object.keys(update).length > 0) {
    await patientModel.updateOne({ _id: patient._id }, { $set: update });
    patient = await patientModel.findById(patient._id);
    console.log(`~ Patient updated: ${seed.firstName} ${seed.lastName}`);
  } else {
    console.log(`= Patient exists: ${seed.firstName} ${seed.lastName}`);
  }

  return patient as Patient;
}

async function ensureTeam(
  teamModel: Model<Team>,
  seed: {
    name: string;
    description?: string;
    department?: string;
    scope?: string;
    color?: string;
    active?: boolean;
  },
  doctorIds: Types.ObjectId[],
) {
  let team = await teamModel.findOne({ name: seed.name });
  if (!team) {
    team = await teamModel.create({
      ...seed,
      doctors: doctorIds,
      active: seed.active !== undefined ? seed.active : true,
    });
    console.log(`+ Team created: ${seed.name}`);
    return team;
  }

  const update: Partial<Team> = {};
  if (!team.description && seed.description) update.description = seed.description;
  if (!team.department && seed.department) update.department = seed.department;
  if (!team.scope && seed.scope) update.scope = seed.scope;
  if (!team.color && seed.color) update.color = seed.color;
  if (!team.doctors || team.doctors.length === 0) {
    update.doctors = doctorIds as any;
  }

  if (Object.keys(update).length > 0) {
    await teamModel.updateOne({ _id: team._id }, { $set: update });
    team = await teamModel.findById(team._id);
    console.log(`~ Team updated: ${seed.name}`);
  } else {
    console.log(`= Team exists: ${seed.name}`);
  }

  return team as Team;
}

async function ensureReservation(
  reservationModel: Model<Reservation>,
  seed: {
    code: string;
    doctor: Types.ObjectId;
    patient: Types.ObjectId;
    procedure: Types.ObjectId;
    slotStart: string;
    slotEnd: string;
    status: string;
    notes?: string;
  },
) {
  const existing = await reservationModel.findOne({ code: seed.code });
  if (existing) {
    console.log(`= Reservation exists: ${seed.code}`);
    return existing;
  }

  const created = await reservationModel.create(seed);
  console.log(`+ Reservation created: ${seed.code}`);
  return created;
}

async function ensurePatientCard(
  patientCardModel: Model<PatientCard>,
  doctorId: Types.ObjectId,
  patientId: Types.ObjectId,
  seed: Partial<PatientCard>,
) {
  const existing = await patientCardModel.findOne({
    doctor: doctorId,
    patient: patientId,
  });

  if (existing) {
    console.log(`= Patient card exists for doctor ${doctorId} and patient ${patientId}`);
    return existing;
  }

  const created = await patientCardModel.create({
    doctor: doctorId,
    patient: patientId,
    ...seed,
  });
  console.log(`+ Patient card created for doctor ${doctorId} and patient ${patientId}`);
  return created;
}

async function ensureMessage(
  messageModel: Model<Message>,
  seed: {
    doctor: Types.ObjectId;
    patient: Types.ObjectId;
    reservation?: Types.ObjectId;
    content: string;
    senderType: 'doctor' | 'patient';
    subject?: string;
  },
) {
  const existing = await messageModel.findOne({
    doctor: seed.doctor,
    patient: seed.patient,
    reservation: seed.reservation,
    content: seed.content,
    senderType: seed.senderType,
  });

  if (existing) {
    console.log(`= Message exists: ${seed.senderType} "${seed.content}"`);
    return existing;
  }

  const created = await messageModel.create({
    ...seed,
    isRead: false,
  });
  console.log(`+ Message created: ${seed.senderType} "${seed.content}"`);
  return created;
}

async function ensureTimeSlot(
  timeSlotModel: Model<TimeSlot>,
  seed: {
    doctor: Types.ObjectId;
    from: Date;
    to: Date;
  },
) {
  const existing = await timeSlotModel.findOne({
    doctor: seed.doctor,
    from: seed.from,
    to: seed.to,
  });

  if (existing) {
    console.log(`= Time slot exists for doctor ${seed.doctor}`);
    return existing;
  }

  const created = await timeSlotModel.create(seed);
  console.log(`+ Time slot created for doctor ${seed.doctor}`);
  return created;
}

async function seedDatabase() {
  const { AppModule } = await import('../app.module');
  const app = await NestFactory.createApplicationContext(AppModule);

  // Hash the default password once
  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);
  console.log(`Using password: ${DEFAULT_PASSWORD} (hashed with bcrypt)`);

  try {
    const clinicModel = app.get<Model<Clinic>>(getModelToken(Clinic.name));
    const clinicAdminModel = app.get<Model<ClinicAdmin>>(getModelToken(ClinicAdmin.name));
    const departmentModel = app.get<Model<Department>>(getModelToken(Department.name));
    const doctorModel = app.get<Model<Doctor>>(getModelToken(Doctor.name));
    const patientModel = app.get<Model<Patient>>(getModelToken(Patient.name));
    const procedureModel = app.get<Model<Procedure>>(getModelToken(Procedure.name));
    const teamModel = app.get<Model<Team>>(getModelToken(Team.name));
    const reservationModel = app.get<Model<Reservation>>(getModelToken(Reservation.name));
    const patientCardModel = app.get<Model<PatientCard>>(getModelToken(PatientCard.name));
    const messageModel = app.get<Model<Message>>(getModelToken(Message.name));
    const timeSlotModel = app.get<Model<TimeSlot>>(getModelToken(TimeSlot.name));

    const clinic = await ensureClinic(clinicModel, {
      name: 'MediCare Central',
      address: 'Main St 1, Prague',
      phoneNumber: '+420700000000',
      email: 'central@medicare.test',
      description: 'Primary clinic location',
      active: true,
    });

    await ensureClinicAdmin(
      clinicAdminModel,
      clinic._id as Types.ObjectId,
      {
        firstName: 'Casey',
        lastName: 'Admin',
        email: 'seed.admin@medicare.test',
        password: hashedPassword,
        active: true,
        role: 'clinic_admin',
      },
    );

    const departments = [
      {
        name: 'Internal Medicine',
        address: 'Main Building, Floor 1',
        phoneNumber: '+420111111111',
      },
      {
        name: 'Surgery',
        address: 'Main Building, Floor 2',
        phoneNumber: '+420111111112',
      },
      {
        name: 'Pediatrics',
        address: 'Main Building, Floor 3',
        phoneNumber: '+420111111113',
      },
    ];

    for (const dept of departments) {
      await ensureDepartment(departmentModel, dept);
    }

    const procedures = [
      { name: 'Ultrasound Exam', price: 500, duration: 30 },
      { name: 'Routine Checkup', price: 300, duration: 15 },
      { name: 'Occupational Health Check', price: 800, duration: 45 },
      { name: 'Blood Test', price: 400, duration: 20 },
    ];

    const procedureDocs = [];
    for (const proc of procedures) {
      procedureDocs.push(await ensureProcedure(procedureModel, proc));
    }

    const weekdayHours = buildAvailableHours('09:00', '17:00', [1, 2, 3, 4, 5]);
    const lateHours = buildAvailableHours('10:00', '18:00', [2, 3, 4]);

    const doctorSeeds: DoctorSeed[] = [
      {
        firstName: 'Alex',
        lastName: 'Stone',
        email: 'seed.doctor1@medicare.test',
        password: hashedPassword,
        specialty: 'Cardiology',
        department: 'Internal Medicine',
        phoneNumber: '+420700000001',
        licenseNumber: 'LIC-1001',
        availableHours: weekdayHours,
        active: true,
      },
      {
        firstName: 'Jordan',
        lastName: 'Lee',
        email: 'seed.doctor2@medicare.test',
        password: hashedPassword,
        specialty: 'Surgery',
        department: 'Surgery',
        phoneNumber: '+420700000002',
        licenseNumber: 'LIC-1002',
        availableHours: lateHours,
        active: true,
      },
      {
        firstName: 'Morgan',
        lastName: 'Klein',
        email: 'seed.doctor3@medicare.test',
        password: hashedPassword,
        specialty: 'Pediatrics',
        department: 'Pediatrics',
        phoneNumber: '+420700000003',
        licenseNumber: 'LIC-1003',
        availableHours: weekdayHours,
        active: true,
      },
    ];

    const doctorDocs = [];
    for (const doc of doctorSeeds) {
      doctorDocs.push(await ensureDoctor(doctorModel, doc));
    }

    const patientSeeds: PatientSeed[] = [
      {
        firstName: 'Taylor',
        lastName: 'Reed',
        email: 'seed.patient1@medicare.test',
        password: hashedPassword,
        phoneNumber: '+420700000010',
        address: 'Main St 10, Prague',
      },
      {
        firstName: 'Jamie',
        lastName: 'Park',
        email: 'seed.patient2@medicare.test',
        password: hashedPassword,
        phoneNumber: '+420700000011',
        address: 'Side St 5, Prague',
      },
    ];

    const patientDocs = [];
    for (const patient of patientSeeds) {
      patientDocs.push(await ensurePatient(patientModel, patient));
    }

    const teamSeeds = [
      {
        name: 'Primary Care Team',
        description: 'General practice and triage',
        department: 'Internal Medicine',
        scope: 'Outpatient',
        color: '#0ea5e9',
      },
      {
        name: 'Surgery Team A',
        description: 'Day surgery team',
        department: 'Surgery',
        scope: 'Surgery',
        color: '#f97316',
      },
    ];

    await ensureTeam(
      teamModel,
      teamSeeds[0],
      [doctorDocs[0]._id as Types.ObjectId, doctorDocs[2]._id as Types.ObjectId],
    );
    await ensureTeam(
      teamModel,
      teamSeeds[1],
      [doctorDocs[1]._id as Types.ObjectId],
    );

    const res1Slot = slotForNextDay(1, 9, 0, procedureDocs[0].duration || 30);
    const res2Slot = slotForNextDay(1, 10, 0, procedureDocs[1].duration || 15);

    const reservation1 = await ensureReservation(reservationModel, {
      code: 'SEED-RES-1',
      doctor: doctorDocs[0]._id as Types.ObjectId,
      patient: patientDocs[0]._id as Types.ObjectId,
      procedure: procedureDocs[0]._id as Types.ObjectId,
      slotStart: res1Slot.start.toISOString(),
      slotEnd: res1Slot.end.toISOString(),
      status: 'confirmed',
      notes: 'Seeded appointment',
    });

    await ensureReservation(reservationModel, {
      code: 'SEED-RES-2',
      doctor: doctorDocs[1]._id as Types.ObjectId,
      patient: patientDocs[1]._id as Types.ObjectId,
      procedure: procedureDocs[1]._id as Types.ObjectId,
      slotStart: res2Slot.start.toISOString(),
      slotEnd: res2Slot.end.toISOString(),
      status: 'pending',
      notes: 'Seeded appointment',
    });

    await ensurePatientCard(
      patientCardModel,
      doctorDocs[0]._id as Types.ObjectId,
      patientDocs[0]._id as Types.ObjectId,
      {
        medicalHistory: 'No major conditions recorded.',
        allergies: 'None reported.',
        currentMedications: 'None',
        notes: 'Initial intake completed.',
        bloodType: 'O+',
        height: 175,
        weight: 72,
        emergencyContact: {
          name: 'Jordan Reed',
          phone: '+420700000099',
          relationship: 'Sibling',
        },
        visitHistory: [
          {
            date: new Date(res1Slot.start),
            procedure: procedureDocs[0].name,
            notes: 'Routine intake visit.',
            reservationId: reservation1._id.toString(),
          },
        ],
      },
    );

    await ensureMessage(messageModel, {
      doctor: doctorDocs[0]._id as Types.ObjectId,
      patient: patientDocs[0]._id as Types.ObjectId,
      reservation: reservation1._id as Types.ObjectId,
      content: 'Your appointment is confirmed.',
      senderType: 'doctor',
      subject: 'Appointment Confirmed',
    });

    await ensureMessage(messageModel, {
      doctor: doctorDocs[0]._id as Types.ObjectId,
      patient: patientDocs[0]._id as Types.ObjectId,
      reservation: reservation1._id as Types.ObjectId,
      content: 'Thank you, see you then.',
      senderType: 'patient',
    });

    const timeSlot = slotForNextDay(2, 13, 0, 120);
    await ensureTimeSlot(timeSlotModel, {
      doctor: doctorDocs[1]._id as Types.ObjectId,
      from: timeSlot.start,
      to: timeSlot.end,
    });

    console.log('\nSeed completed.');
  } finally {
    await app.close();
  }
}

seedDatabase().catch((error) => {
  console.error('Seed failed:', error);
  process.exitCode = 1;
});
