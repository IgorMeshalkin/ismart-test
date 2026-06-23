import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const frontendOrigin = config.get<string>('FRONTEND_ORIGIN') ?? 'http://localhost:3000';
  const port = Number(config.get<string>('PORT') ?? 8081);
  const kafkaBrokers = (config.get<string>('KAFKA_BROKERS') ?? 'localhost:9092').split(',');

  app.enableCors({ origin: frontendOrigin });

  app.connectMicroservice({
    transport: Transport.KAFKA,
    options: {
      client: { clientId: 'ismart-transcriber', brokers: kafkaBrokers },
      consumer: { groupId: 'ismart-transcriber' },
    },
  });

  await app.startAllMicroservices();
  await app.listen(port);
}

void bootstrap();
