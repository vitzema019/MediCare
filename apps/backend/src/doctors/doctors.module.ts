import { Module } from '@nestjs/common';
import { DoctorsController } from './doctors.controller';
import { DoctorsService } from './doctors.service';
import { DoctorDaoMock } from '../reservations/mock/doctor.dao.mock';

@Module({
  controllers: [DoctorsController],
  providers: [DoctorsService, DoctorDaoMock],
  exports: [DoctorsService],
})
export class DoctorsModule {}
