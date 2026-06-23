import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  FileEntity,
  KnowledgeBaseEntity,
  KnowledgeBaseFileEntity,
  KnowledgeBaseSubscriberEntity,
  NotificationEntity,
  PlanEntity,
  TranscriptionJobEntity,
  UserEntity,
  UserPlanEntity,
} from '@entities';
import { AuthModule } from './auth/auth.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        const databaseUrl = process.env.DATABASE_URL;

        if (!databaseUrl) {
          throw new Error('DATABASE_URL environment variable is required');
        }

        return {
          type: 'postgres' as const,
          url: databaseUrl,
          entities: [
            UserEntity,
            PlanEntity,
            UserPlanEntity,
            FileEntity,
            TranscriptionJobEntity,
            KnowledgeBaseEntity,
            KnowledgeBaseFileEntity,
            KnowledgeBaseSubscriberEntity,
            NotificationEntity,
          ],
          synchronize: process.env.NODE_ENV !== 'production',
        };
      },
      dataSourceFactory: async (options) => {
        if (!options) {
          throw new Error('TypeORM options are required');
        }

        const dataSource = await new DataSource(options).initialize();
        console.log('Database connection established');

        return dataSource;
      },
    }),
    AuthModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
