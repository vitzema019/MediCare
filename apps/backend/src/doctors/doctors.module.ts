import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Doctor, DoctorSchema } from '../entities/doctor.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Doctor.name,
        schema: DoctorSchema,
      },
    ]),
  ],
  exports: [],
})
export class DoctorsModule { }
