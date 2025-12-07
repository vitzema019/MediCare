import { Module, type DynamicModule } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { ReservationsModule } from './reservations/reservations.module';
import { LoggerModule } from 'nestjs-pino';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppLoggerService } from './common/logger.service';
import { TimeslotsModule } from './timeslots/timeslots.module';
import { DoctorsModule } from './doctors/doctors.module';

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
    HealthModule,
    ReservationsModule,
    TimeslotsModule,
    DoctorsModule,
  ],
  controllers: [AppController],
  providers: [AppLoggerService]
})
export class AppModule { }
