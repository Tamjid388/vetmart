import dotenv from 'dotenv';
import { defineConfig, env } from 'prisma/config';

dotenv.config();

export default defineConfig({
  schema: 'prisma/schema',
  datasource: {
    url: env('DATABASE_URL'),
  },
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
});
