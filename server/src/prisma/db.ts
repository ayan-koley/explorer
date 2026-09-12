import 'dotenv/config';
import postgres from '@prisma/orm-postgres/runtime';
import type { Contract } from './contract.d.js';
import contractJson from './contract.json' with { type: 'json' };

const db_uri = process.env.DATABASE_URL;

if(!db_uri) {
  console.log('database url is missing');
}

export const db = postgres<Contract>({
  contractJson,
  url: process.env['DATABASE_URL']!,
});
