import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClinicManagementController } from './clinic-management.controller';
import { ClinicManagementService } from './clinic-management.service';
import { Doctor, DoctorSchema } from '../entities/doctor.entity';
import { Department, DepartmentSchema } from '../entities/department.entity';
import { Clinic, ClinicSchema } from '../entities/clinic.entity';
import { ClinicAdmin, ClinicAdminSchema } from '../entities/clinic-admin.entity';
import { Team, TeamSchema } from '../entities/team.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Doctor.name, schema: DoctorSchema },
      { name: Department.name, schema: DepartmentSchema },
      { name: Clinic.name, schema: ClinicSchema },
      { name: ClinicAdmin.name, schema: ClinicAdminSchema },
      { name: Team.name, schema: TeamSchema },
    ]),
  ],
  controllers: [ClinicManagementController],
  providers: [ClinicManagementService],
  exports: [ClinicManagementService],
})
export class ClinicManagementModule {}


