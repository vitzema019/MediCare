import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { DepartmentsService } from './departments.service';

@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Get()
  async findAll() {
    const departments = await this.departmentsService.findAll();
    return departments.map(dept => ({
      id: dept._id.toString(),
      name: dept.name,
      address: dept.address,
      phoneNumber: dept.phoneNumber,
    }));
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const department = await this.departmentsService.findById(id);
    if (!department) {
      throw new NotFoundException(`Department with id ${id} not found`);
    }
    return {
      id: department._id.toString(),
      name: department.name,
      address: department.address,
      phoneNumber: department.phoneNumber,
    };
  }
}



