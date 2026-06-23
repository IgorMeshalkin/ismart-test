import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileEntity, TranscriptionJobEntity } from '@entities';
import { AuthModule } from '../auth/auth.module';
import { StorageModule } from '../storage/storage.module';
import { KafkaProducerModule } from '../kafka/kafka-producer.module';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([FileEntity, TranscriptionJobEntity]),
    AuthModule,
    StorageModule,
    KafkaProducerModule,
  ],
  controllers: [FilesController],
  providers: [FilesService],
})
export class FilesModule {}
