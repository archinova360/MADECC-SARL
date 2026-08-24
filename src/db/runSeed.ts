import { seedDatabase } from './seed.ts';

async function main() {
  console.log('Manually invoking database seeder...');
  await seedDatabase();
  console.log('Seeder invocation complete.');
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error during manual seeding:', err);
  process.exit(1);
});
