import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Department } from '../entities/department.entity';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectModel(Department.name) private departmentModel: Model<Department>,
  ) {}

  async findAll() {
    return this.departmentModel.find().lean();
  }

  async findById(id: string) {
    return this.departmentModel.findById(id).lean();
  }
}



