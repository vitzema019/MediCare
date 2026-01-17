import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ClinicManagementService } from './clinic-management.service';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { AssignSpecialtyDto } from './dto/assign-specialty.dto';
import { CreateDoctorDto } from '../doctors/dto/create-doctor.dto';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@UseGuards(RolesGuard)
@Roles('admin')
@Controller('clinic-management')
export class ClinicManagementController {
  constructor(private readonly clinicManagementService: ClinicManagementService) {}

  /**
   * Get all doctors
   */
  @Get('doctors')
  async getAllDoctors() {
    return this.clinicManagementService.getAllDoctors();
  }

  /**
   * Get doctors grouped by specialty
   */
  @Get('doctors/by-specialty')
  async getDoctorsBySpecialty() {
    return this.clinicManagementService.getDoctorsBySpecialty();
  }

  /**
   * Get doctors grouped by department
   */
  @Get('doctors/by-department')
  async getDoctorsByDepartment() {
    return this.clinicManagementService.getDoctorsByDepartment();
  }

  /**
   * Get all specialties
   */
  @Get('specialties')
  async getSpecialties() {
    return this.clinicManagementService.getSpecialties();
  }

  /**
   * Get all departments
   */
  @Get('departments')
  async getDepartments() {
    return this.clinicManagementService.getDepartments();
  }

  /**
   * Get clinic statistics
   */
  @Get('statistics')
  async getStatistics() {
    return this.clinicManagementService.getClinicStatistics();
  }

  /**
   * Create a new doctor
   */
  @Post('doctors')
  async createDoctor(@Body() createDto: CreateDoctorDto) {
    return this.clinicManagementService.createDoctor(createDto);
  }

  /**
   * Update a doctor
   */
  @Patch('doctors/:id')
  async updateDoctor(@Param('id') id: string, @Body() updateDto: UpdateDoctorDto) {
    return this.clinicManagementService.updateDoctor(id, updateDto);
  }

  /**
   * Assign specialty/department to a doctor
   */
  @Patch('doctors/:id/assign-specialty')
  async assignSpecialty(@Param('id') id: string, @Body() assignDto: AssignSpecialtyDto) {
    return this.clinicManagementService.assignSpecialty(id, assignDto);
  }

  /**
   * Toggle doctor active status
   */
  @Patch('doctors/:id/toggle-status')
  async toggleDoctorStatus(@Param('id') id: string) {
    return this.clinicManagementService.toggleDoctorStatus(id);
  }

  /**
   * Delete a doctor
   */
  @Delete('doctors/:id')
  async deleteDoctor(@Param('id') id: string) {
    await this.clinicManagementService.deleteDoctor(id);
    return { message: 'Doctor deleted successfully' };
  }

  /**
   * Get all teams
   */
  @Get('teams')
  async getAllTeams() {
    return this.clinicManagementService.getAllTeams();
  }

  /**
   * Get a team by ID
   */
  @Get('teams/:id')
  async getTeamById(@Param('id') id: string) {
    return this.clinicManagementService.getTeamById(id);
  }

  /**
   * Create a new team
   */
  @Post('teams')
  async createTeam(@Body() createDto: CreateTeamDto) {
    return this.clinicManagementService.createTeam(createDto);
  }

  /**
   * Update a team
   */
  @Patch('teams/:id')
  async updateTeam(@Param('id') id: string, @Body() updateDto: UpdateTeamDto) {
    return this.clinicManagementService.updateTeam(id, updateDto);
  }

  /**
   * Delete a team
   */
  @Delete('teams/:id')
  async deleteTeam(@Param('id') id: string) {
    await this.clinicManagementService.deleteTeam(id);
    return { message: 'Team deleted successfully' };
  }

  /**
   * Add doctors to a team
   */
  @Post('teams/:id/doctors')
  async addDoctorsToTeam(@Param('id') id: string, @Body() body: { doctorIds: string[] }) {
    return this.clinicManagementService.addDoctorsToTeam(id, body.doctorIds);
  }

  /**
   * Remove doctors from a team
   */
  @Delete('teams/:id/doctors')
  async removeDoctorsFromTeam(@Param('id') id: string, @Body() body: { doctorIds: string[] }) {
    return this.clinicManagementService.removeDoctorsFromTeam(id, body.doctorIds);
  }
}


