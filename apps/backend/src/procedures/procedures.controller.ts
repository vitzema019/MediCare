import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { ProceduresService } from './procedures.service';
import { Public } from '../auth/decorators/public.decorator';

@Public()
@Controller('procedures')
export class ProceduresController {
  constructor(private readonly proceduresService: ProceduresService) {}

  @Get()
  async findAll() {
    const procedures = await this.proceduresService.findAll();
    return procedures.map(proc => ({
      id: proc._id.toString(),
      name: proc.name,
      price: proc.price,
      duration: proc.duration,
    }));
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const procedure = await this.proceduresService.findById(id);
    if (!procedure) {
      throw new NotFoundException(`Procedure with id ${id} not found`);
    }
    return {
      id: procedure._id.toString(),
      name: procedure.name,
      price: procedure.price,
      duration: procedure.duration,
    };
  }
}



