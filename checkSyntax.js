import { execFileSync } from 'child_process';

const files = [
  'src/events/messageCreate.js',
  'src/events/interactionCreate.js'
];

for (const file of files) {
  console.log(`\n=== Checking ${file} ===`);

  try {
    execFileSync(process.execPath, ['--check', file], {
      stdio: 'inherit'
    });

    console.log('SYNTAX_OK');
  } catch {
    console.log('SYNTAX_ERROR');
  }
}
