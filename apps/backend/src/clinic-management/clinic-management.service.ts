import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Doctor } from '../entities/doctor.entity';
import { Department } from '../entities/department.entity';
import { Clinic } from '../entities/clinic.entity';
import { ClinicAdmin } from '../entities/clinic-admin.entity';
import { Team } from '../entities/team.entity';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { AssignSpecialtyDto } from './dto/assign-specialty.dto';
import { CreateDoctorDto } from '../doctors/dto/create-doctor.dto';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';

@Injectable()
export class ClinicManagementService {
  constructor(
    @InjectModel(Doctor.name) private doctorModel: Model<Doctor>,
    @InjectModel(Department.name) private departmentModel: Model<Department>,
    @InjectModel(Clinic.name) private clinicModel: Model<Clinic>,
    @InjectModel(ClinicAdmin.name) private clinicAdminModel: Model<ClinicAdmin>,
    @InjectModel(Team.name) private teamModel: Model<Team>,
  ) {}

  /**
   * Get all doctors with their specialties and departments
   */
  async getAllDoctors(): Promise<Doctor[]> {
    return this.doctorModel.find().lean() as any;
  }

  /**
   * Get doctors grouped by specialty
   */
  async getDoctorsBySpecialty(): Promise<Record<string, Doctor[]>> {
    const doctors = await this.doctorModel.find().lean() as any[];
    const grouped: Record<string, Doctor[]> = {};

    doctors.forEach((doctor: any) => {
      const specialty = doctor.specialty || 'Unassigned';
      if (!grouped[specialty]) {
        grouped[specialty] = [];
      }
      grouped[specialty].push(doctor);
    });

    return grouped;
  }

  /**
   * Get doctors grouped by department
   */
  async getDoctorsByDepartment(): Promise<Record<string, Doctor[]>> {
    const doctors = await this.doctorModel.find().lean() as any[];
    const grouped: Record<string, Doctor[]> = {};

    doctors.forEach((doctor: any) => {
      const department = doctor.department || 'Unassigned';
      if (!grouped[department]) {
        grouped[department] = [];
      }
      grouped[department].push(doctor);
    });

    return grouped;
  }

  /**
   * Get all unique specialties
   */
  async getSpecialties(): Promise<string[]> {
    const doctors = await this.doctorModel.find({ specialty: { $exists: true, $ne: null } }).lean() as any[];
    const specialties = new Set<string>();
    
    doctors.forEach((doctor: any) => {
      if (doctor.specialty) {
        specialties.add(doctor.specialty);
      }
    });

    return Array.from(specialties).sort();
  }

  /**
   * Get all departments
   */
  async getDepartments(): Promise<Department[]> {
    return this.departmentModel.find().lean() as any;
  }

  /**
   * Update a doctor's information
   */
  async updateDoctor(doctorId: string, updateDto: UpdateDoctorDto): Promise<Doctor> {
    const doctor = await this.doctorModel.findByIdAndUpdate(
      doctorId,
      { $set: updateDto },
      { new: true, runValidators: true }
    ).lean();

    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${doctorId} not found`);
    }

    return doctor as any;
  }

  /**
   * Assign specialty to a doctor
   */
  async assignSpecialty(doctorId: string, assignDto: AssignSpecialtyDto): Promise<Doctor> {
    const doctor = await this.doctorModel.findByIdAndUpdate(
      doctorId,
      { 
        $set: { 
          specialty: assignDto.specialty,
          department: assignDto.department,
        } 
      },
      { new: true, runValidators: true }
    );

    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${doctorId} not found`);
    }

    return doctor.toObject() as any;
  }

  /**
   * Create a new doctor (for clinic admin)
   */
  async createDoctor(createDto: CreateDoctorDto): Promise<Doctor> {
    // Check if doctor with this email already exists
    const existingDoctor = await this.doctorModel.findOne({
      email: createDto.email,
    });

    if (existingDoctor) {
      throw new BadRequestException('Doctor with this email already exists');
    }

    const doctor = await this.doctorModel.create({
      firstName: createDto.firstName,
      lastName: createDto.lastName,
      email: createDto.email,
      password: createDto.password,
      specialty: createDto.specialty,
      department: createDto.department,
      phoneNumber: createDto.phoneNumber,
      licenseNumber: createDto.licenseNumber,
      active: true,
    });

    return doctor;
  }

  /**
   * Delete a doctor
   */
  async deleteDoctor(doctorId: string): Promise<void> {
    const result = await this.doctorModel.findByIdAndDelete(doctorId);
    if (!result) {
      throw new NotFoundException(`Doctor with ID ${doctorId} not found`);
    }
  }

  /**
   * Toggle doctor active status
   */
  async toggleDoctorStatus(doctorId: string): Promise<Doctor> {
    const doctor = await this.doctorModel.findById(doctorId);
    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${doctorId} not found`);
    }

    doctor.active = !doctor.active;
    await doctor.save();

    return doctor;
  }

  /**
   * Get clinic statistics
   */
  async getClinicStatistics() {
    const totalDoctors = await this.doctorModel.countDocuments();
    const activeDoctors = await this.doctorModel.countDocuments({ active: true });
    const specialties = await this.getSpecialties();
    const departments = await this.departmentModel.countDocuments();
    const totalTeams = await this.teamModel.countDocuments();

    return {
      totalDoctors,
      activeDoctors,
      inactiveDoctors: totalDoctors - activeDoctors,
      totalSpecialties: specialties.length,
      totalDepartments: departments,
      totalTeams,
      specialties,
    };
  }

  /**
   * Get all teams
   */
  async getAllTeams(): Promise<Team[]> {
    const teams = await this.teamModel.find().populate({
      path: 'doctors',
      select: 'firstName lastName email specialty department active'
    }).lean();
    
    // Debug: Log team structure
    if (teams.length > 0 && teams[0].doctors && teams[0].doctors.length > 0) {
      console.log('Backend - First team doctors:', JSON.stringify(teams[0].doctors[0], null, 2));
      console.log('Backend - Doctor type:', typeof teams[0].doctors[0]);
    }
    
    return teams as any;
  }

  /**
   * Get a team by ID
   */
  async getTeamById(teamId: string): Promise<Team> {
    const team = await this.teamModel.findById(teamId).populate('doctors', 'firstName lastName email specialty department active').lean();
    if (!team) {
      throw new NotFoundException(`Team with ID ${teamId} not found`);
    }
    return team as any;
  }

  /**
   * Create a new team
   */
  async createTeam(createDto: CreateTeamDto): Promise<Team> {
    const doctorIds = createDto.doctorIds?.map(id => new Types.ObjectId(id)) || [];
    
    const team = await this.teamModel.create({
      name: createDto.name,
      description: createDto.description,
      department: createDto.department,
      scope: createDto.scope,
      doctors: doctorIds,
      color: createDto.color || '#3b82f6', // Default blue color
      active: createDto.active !== undefined ? createDto.active : true,
    });

    return this.getTeamById(team._id.toString());
  }

  /**
   * Update a team
   */
  async updateTeam(teamId: string, updateDto: UpdateTeamDto): Promise<Team> {
    const updateData: any = {};
    
    if (updateDto.name !== undefined) updateData.name = updateDto.name;
    if (updateDto.description !== undefined) updateData.description = updateDto.description;
    if (updateDto.department !== undefined) updateData.department = updateDto.department;
    if (updateDto.scope !== undefined) updateData.scope = updateDto.scope;
    if (updateDto.color !== undefined) updateData.color = updateDto.color;
    if (updateDto.active !== undefined) updateData.active = updateDto.active;
    if (updateDto.doctorIds !== undefined) {
      // Filter out any empty strings or invalid IDs
      const validDoctorIds = updateDto.doctorIds.filter(id => id && id.trim() !== '');
      updateData.doctors = validDoctorIds.map(id => new Types.ObjectId(id));
    }

    const team = await this.teamModel.findByIdAndUpdate(
      teamId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean();

    if (!team) {
      throw new NotFoundException(`Team with ID ${teamId} not found`);
    }

    // Return populated team
    return this.getTeamById(teamId);
  }

  /**
   * Delete a team
   */
  async deleteTeam(teamId: string): Promise<void> {
    const result = await this.teamModel.findByIdAndDelete(teamId);
    if (!result) {
      throw new NotFoundException(`Team with ID ${teamId} not found`);
    }
  }

  /**
   * Add doctors to a team
   */
  async addDoctorsToTeam(teamId: string, doctorIds: string[]): Promise<Team> {
    const team = await this.teamModel.findById(teamId);
    if (!team) {
      throw new NotFoundException(`Team with ID ${teamId} not found`);
    }

    const newDoctorIds = doctorIds.map(id => new Types.ObjectId(id));
    const existingDoctorIds = team.doctors.map((d: any) => d.toString());
    
    // Add only doctors that aren't already in the team
    const doctorsToAdd = newDoctorIds.filter(id => !existingDoctorIds.includes(id.toString()));
    
    if (doctorsToAdd.length > 0) {
      team.doctors.push(...doctorsToAdd as any);
      await team.save();
    }

    return this.getTeamById(teamId);
  }

  /**
   * Remove doctors from a team
   */
  async removeDoctorsFromTeam(teamId: string, doctorIds: string[]): Promise<Team> {
    const team = await this.teamModel.findById(teamId);
    if (!team) {
      throw new NotFoundException(`Team with ID ${teamId} not found`);
    }

    const doctorIdsToRemove = doctorIds.map(id => new Types.ObjectId(id));
    team.doctors = team.doctors.filter((d: any) => 
      !doctorIdsToRemove.some(id => id.toString() === d.toString())
    ) as any;
    
    await team.save();

    return this.getTeamById(teamId);
  }
}


