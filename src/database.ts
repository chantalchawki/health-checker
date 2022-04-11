import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: 'database',
  port: 3306,
  username: 'admin',
  password: 'admin',
  database: 'health-checker',
  synchronize: true,
  logging: false,
  entities: ['src/entities/*.ts'],
});
