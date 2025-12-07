import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

// 1) Načti .env dřív, než se natáhne AppModule
// - funguje jak v TS, tak po buildu v dist/apps/backend/src
const envCandidates = [
  // při běhu z dist: ../../../../.env → ale použijeme __dirname variantu:
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
