import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Doctor } from './entities/doctor.entity';
import { Department } from './entities/department.entity';
import { Procedure } from './entities/procedure.entity';

// 1) Načti .env dřív, než se natáhne AppModule
// - funguje jak v TS, tak po buildu v dist/src
const envCandidates = [
  // při běhu z dist: ../../.env → ale použijeme __dirname variantu:
  path.resolve(__dirname, '.env'),
  path.resolve(__dirname, '../../../.env'),
  // fallback přes working directory (když běží z apps/backend)
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../../.env')
];

for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

async function seedInitialData(app: any) {
  try {
    const doctorModel = app.get(getModelToken(Doctor.name)) as Model<Doctor>;
    const departmentModel = app.get(getModelToken(Department.name)) as Model<Department>;
    const procedureModel = app.get(getModelToken(Procedure.name)) as Model<Procedure>;
    
    // Seed doctors
    const doctorsToSeed = [
      { firstName: 'Jan', lastName: 'Novák', active: true },
      { firstName: 'Anna', lastName: 'Dvořáková', active: true },
      { firstName: 'Petr', lastName: 'Svoboda', active: true },
      { firstName: 'Marie', lastName: 'Černá', active: true },
      { firstName: 'Eva', lastName: 'Růžičková', active: true }, // Dr. Růžičková from user story
    ];

    let createdCount = 0;
    for (const doctorData of doctorsToSeed) {
      const existing = await doctorModel.findOne({
        firstName: doctorData.firstName,
        lastName: doctorData.lastName,
      });

      if (!existing) {
        const doctor = await doctorModel.create(doctorData);
        console.log(`✓ Seeded doctor: Dr. ${doctor.firstName} ${doctor.lastName} (ID: ${doctor._id.toString()})`);
        createdCount++;
      }
    }

    if (createdCount > 0) {
      console.log(`✓ Database seeded: ${createdCount} new doctor(s) created`);
    }

    // Seed departments
    const departmentsToSeed = [
      { name: 'Interní oddělení', address: 'Hlavní budova, 1. patro', phoneNumber: '+420 123 456 789' },
      { name: 'Chirurgické oddělení', address: 'Hlavní budova, 2. patro', phoneNumber: '+420 123 456 790' },
      { name: 'Pediatrické oddělení', address: 'Hlavní budova, 3. patro', phoneNumber: '+420 123 456 791' },
    ];

    createdCount = 0;
    for (const deptData of departmentsToSeed) {
      const existing = await departmentModel.findOne({ name: deptData.name });
      if (!existing) {
        const dept = await departmentModel.create(deptData);
        console.log(`✓ Seeded department: ${dept.name} (ID: ${dept._id.toString()})`);
        createdCount++;
      }
    }

    if (createdCount > 0) {
      console.log(`✓ Database seeded: ${createdCount} new department(s) created`);
    }

    // Seed procedures
    const proceduresToSeed = [
      { name: 'Ultrazvukové vyšetření', price: 500, duration: 30 },
      { name: 'Pracovnělékařská prohlídka', price: 800, duration: 45 }, // Occupational health check
      { name: 'Rutinní kontrola', price: 300, duration: 15 },
      { name: 'Krevní testy', price: 400, duration: 20 },
    ];

    createdCount = 0;
    for (const procData of proceduresToSeed) {
      const existing = await procedureModel.findOne({ name: procData.name });
      if (!existing) {
        const proc = await procedureModel.create(procData);
        console.log(`✓ Seeded procedure: ${proc.name} (ID: ${proc._id.toString()})`);
        createdCount++;
      }
    }

    if (createdCount > 0) {
      console.log(`✓ Database seeded: ${createdCount} new procedure(s) created`);
    }

    console.log('\n✓ Database seeding completed\n');
  } catch (error) {
    console.warn('Warning: Could not seed initial data:', error);
    // Don't fail startup if seeding fails
  }
}

async function bootstrap() {
  const { AppModule } = await import('./app.module');

  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.use(helmet());
  app.enableCors();
  app.use(rateLimit({ windowMs: 60_000, max: 300 }));

  const config = new DocumentBuilder()
    .setTitle('API dokumentace')
    .setDescription('Základní dokumentace k API pro tento projekt.')
    .setVersion('0.1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
        SwaggerModule.setup('api-docs', app, document);

        // Seed initial data automatically on startup
        await seedInitialData(app);

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  // Nápověda:
  // - Health: GET http://localhost:3000/health
  // - Swagger: http://localhost:3000/api-docs
}
bootstrap().catch((error) => {
  console.error('Nest application bootstrap failed:', error);
  process.exitCode = 1;
});
