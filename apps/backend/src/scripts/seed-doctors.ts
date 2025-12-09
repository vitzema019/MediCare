import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Doctor } from '../entities/doctor.entity';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
const envPath = path.resolve(__dirname, '../../../.env');
if (require('fs').existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

async function seedDoctors() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const doctorModel = app.get<Model<Doctor>>(getModelToken(Doctor.name));

  try {
    // Create multiple doctors (will skip if already exist)
    const doctorsToSeed = [
      { firstName: 'Jan', lastName: 'Novák', active: true },
      { firstName: 'Anna', lastName: 'Dvořáková', active: true },
      { firstName: 'Petr', lastName: 'Svoboda', active: true },
      { firstName: 'Marie', lastName: 'Černá', active: true },
    ];

    let createdCount = 0;
    for (const doctorData of doctorsToSeed) {
      const existing = await doctorModel.findOne({
        firstName: doctorData.firstName,
        lastName: doctorData.lastName,
      });

      if (!existing) {
        const doctor = await doctorModel.create(doctorData);
        console.log(`✓ Created doctor: Dr. ${doctor.firstName} ${doctor.lastName} (ID: ${doctor._id.toString()})`);
        createdCount++;
      } else {
        console.log(`- Doctor already exists: Dr. ${doctorData.firstName} ${doctorData.lastName} (ID: ${existing._id.toString()})`);
      }
    }

    console.log(`\nTotal: ${createdCount} new doctor(s) created, ${doctorsToSeed.length - createdCount} already existed`);
  } catch (error) {
    console.error('Error seeding doctors:', error);
    throw error;
  } finally {
    await app.close();
  }
}

seedDoctors().catch((error) => {
  console.error('Error seeding doctors:', error);
  process.exit(1);
});

