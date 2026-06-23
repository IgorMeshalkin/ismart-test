import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const frontendOrigin = config.get<string>('FRONTEND_ORIGIN') ?? 'http://localhost:3000';
  const port = Number(config.get<string>('PORT') ?? 8081);

  app.enableCors({ origin: frontendOrigin });
  await app.listen(port);
}

void bootstrap();
