import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { seedProblems, seedSessions } from './seed-data';
import { problems, sessions } from './schema';

async function seed() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required to seed Postgres.');
  }

  const db = drizzle(neon(databaseUrl));
  await db.delete(sessions);
  await db.delete(problems);
  await db.insert(problems).values(seedProblems);
  await db.insert(sessions).values(seedSessions);
  console.log(`Seeded ${seedProblems.length} problems and ${seedSessions.length} sessions.`);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
