import { Module } from '@nestjs/common';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';

import { DoctorDaoMock } from './mock/doctor.dao.mock';
import { PatientDaoMock } from './mock/patient.dao.mock';
import { ProcedureDaoMock } from './mock/procedure.dao.mock';
import { DepartmentDaoMock } from './mock/department.dao.mock';
import { ReservationDaoMock } from './mock/reservation.dao.mock';
import { MongooseModule } from '@nestjs/mongoose';
import { Department, DepartmentSchema } from '../entities/department.entity';
import { Doctor, DoctorSchema } from '../entities/doctor.entity';
import { Patient, PatientSchema } from '../entities/patient.entity';
import { Procedure, ProcedureSchema } from '../entities/procedure.entity';
import { Reservation, ReservationSchema } from '../entities/reservation.entity';
import { TimeSlot, TimeSlotSchema } from '../entities/timeslot.entity';
import { MessagesModule } from '../messages/messages.module';
import { PatientCardsModule } from '../patient-cards/patient-cards.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Department.name, schema: DepartmentSchema },
      { name: Doctor.name, schema: DoctorSchema },
      { name: Patient.name, schema: PatientSchema },
      { name: Procedure.name, schema: ProcedureSchema },
      { name: Reservation.name, schema: ReservationSchema },
      { name: TimeSlot.name, schema: TimeSlotSchema },
    ]),
    MessagesModule,
    PatientCardsModule,
  ],

  controllers: [ReservationsController],
  providers: [
    ReservationsService,
    DoctorDaoMock,
    PatientDaoMock,
    ProcedureDaoMock,
    DepartmentDaoMock,
    ReservationDaoMock,
  ],
  exports: [ReservationsService],
})
export class ReservationsModule { }
