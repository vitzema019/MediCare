import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PatientCardsController } from './patient-cards.controller';
import { PatientCardsService } from './patient-cards.service';
import { PatientCard, PatientCardSchema } from '../entities/patient-card.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PatientCard.name, schema: PatientCardSchema },
    ]),
  ],
  controllers: [PatientCardsController],
  providers: [PatientCardsService],
  exports: [PatientCardsService],
})
export class PatientCardsModule {}



