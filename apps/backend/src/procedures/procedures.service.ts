import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Procedure } from '../entities/procedure.entity';

@Injectable()
export class ProceduresService {
  constructor(
    @InjectModel(Procedure.name) private procedureModel: Model<Procedure>,
  ) {}

  async findAll() {
    return this.procedureModel.find().lean();
  }

  async findById(id: string) {
    return this.procedureModel.findById(id).lean();
  }
}



