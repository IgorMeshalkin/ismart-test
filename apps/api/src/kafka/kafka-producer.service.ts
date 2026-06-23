import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientKafka, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private readonly client: ClientKafka;

  constructor(config: ConfigService) {
    const brokers = config.getOrThrow<string>('KAFKA_BROKERS').split(',');

    this.client = ClientProxyFactory.create({
      transport: Transport.KAFKA,
      options: {
        client: { clientId: 'ismart-api', brokers },
      },
    }) as ClientKafka;
  }

  async onModuleInit(): Promise<void> {
    await this.client.connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.close();
  }

  async publish(topic: string, key: string, message: unknown): Promise<void> {
    await firstValueFrom(
      this.client.emit(topic, { key, value: message }),
    );
  }
}
