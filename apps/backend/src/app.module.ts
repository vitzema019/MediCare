import { Module, type DynamicModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { HealthModule } from './health/health.module';
import { ReservationsModule } from './reservations/reservations.module';
import { LoggerModule } from 'nestjs-pino';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppLoggerService } from './common/logger.service';
import { TimeslotsModule } from './timeslots/timeslots.module';
import { DoctorsModule } from './doctors/doctors.module';
import { PatientsModule } from './patients/patients.module';
import { DepartmentsModule } from './departments/departments.module';
import { ProceduresModule } from './procedures/procedures.module';
import { MessagesModule } from './messages/messages.module';
import { PatientCardsModule } from './patient-cards/patient-cards.module';
import { ClinicManagementModule } from './clinic-management/clinic-management.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

function resolveDatabaseModule(): DynamicModule[] {
  if (process.env.NODE_ENV === 'test') {
    return [];
  }

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error('MONGO_URI must be defined unless NODE_ENV is "test".');
  }

  return [
    MongooseModule.forRoot(mongoUri, {
      dbName: process.env.MONGO_DB_NAME
    })
  ];
}

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        transport: process.env.NODE_ENV !== 'production' ? { target: 'pino-pretty' } : undefined,
        autoLogging: true
      }
    }),
    ...resolveDatabaseModule(),
    AuthModule,
    HealthModule,
    ReservationsModule,
    TimeslotsModule,
    DoctorsModule,
    PatientsModule,
    DepartmentsModule,
    ProceduresModule,
    MessagesModule,
    PatientCardsModule,
    ClinicManagementModule,
  ],
  controllers: [AppController],
  providers: [
    AppLoggerService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ]
})
export class AppModule { }
