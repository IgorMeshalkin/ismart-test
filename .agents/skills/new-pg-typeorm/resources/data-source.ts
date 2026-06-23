import 'dotenv/config';
import { join } from 'node:path';
import { DataSource } from 'typeorm';
import { SnakeNamingStrategyLocal } from './snake-naming.strategy';

const requiredEnvironmentVariable = (name: string): string => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

export default new DataSource({
  type: 'postgres',
  host: requiredEnvironmentVariable('DB_HOST'),
  port: Number(requiredEnvironmentVariable('DB_PORT')),
  username: requiredEnvironmentVariable('DB_USER'),
  password: requiredEnvironmentVariable('DB_PASS'),
  database: requiredEnvironmentVariable('DB_NAME'),
  entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
  migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
  synchronize: false,
  namingStrategy: new SnakeNamingStrategyLocal(),
});
