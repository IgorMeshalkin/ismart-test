import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { TranscriptionModule } from './transcription/transcription.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TranscriptionModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
