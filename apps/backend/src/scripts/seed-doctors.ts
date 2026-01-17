import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Doctor } from '../entities/doctor.entity';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcrypt';

const DEFAULT_PASSWORD = 'admin123';
const SALT_ROUNDS = 10;

// Load environment variables - check multiple possible locations
const envCandidates = [
  path.resolve(__dirname, '../../../.env'),      // apps/backend/.env
  path.resolve(__dirname, '../../../../../.env'), // root .env (from dist)
  path.resolve(process.cwd(), '.env'),           // current working directory
  path.resolve(process.cwd(), '../../.env'),     // root from apps/backend
];

for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    console.log(`Loading .env from: ${envPath}`);
    dotenv.config({ path: envPath });
    break;
  }
}

async function seedDoctors() {
  const { AppModule } = await import('../app.module');
  const app = await NestFactory.createApplicationContext(AppModule);
  const doctorModel = app.get<Model<Doctor>>(getModelToken(Doctor.name));

  // Hash the default password once
  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);
  console.log(`Using password: ${DEFAULT_PASSWORD} (hashed with bcrypt)`);

  try {
    // Create multiple doctors (will skip if already exist)
    const doctorsToSeed = [
      { firstName: 'Jan', lastName: 'Novák', email: 'jan.novak@medicare.test', password: hashedPassword, active: true },
      { firstName: 'Anna', lastName: 'Dvořáková', email: 'anna.dvorakova@medicare.test', password: hashedPassword, active: true },
      { firstName: 'Petr', lastName: 'Svoboda', email: 'petr.svoboda@medicare.test', password: hashedPassword, active: true },
      { firstName: 'Marie', lastName: 'Černá', email: 'marie.cerna@medicare.test', password: hashedPassword, active: true },
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
        // Update existing doctor with email and password if missing
        const updates: Record<string, string> = {};
        if (!existing.email) updates.email = doctorData.email;
        if (!existing.password) updates.password = doctorData.password;

        if (Object.keys(updates).length > 0) {
          await doctorModel.updateOne({ _id: existing._id }, { $set: updates });
          console.log(`~ Updated doctor: Dr. ${doctorData.firstName} ${doctorData.lastName} (ID: ${existing._id.toString()})`);
        } else {
          console.log(`- Doctor already exists: Dr. ${doctorData.firstName} ${doctorData.lastName} (ID: ${existing._id.toString()})`);
        }
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
