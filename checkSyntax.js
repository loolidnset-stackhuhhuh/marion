import fs from 'fs';

const files = [
  'src/events/messageCreate.js',
  'src/events/interactionCreate.js'
];

for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');

  console.log(`\n=== ${file} ===`);
  console.log(`Characters: ${source.length}`);
  console.log(`First character code: ${source.charCodeAt(0)}`);
  console.log(`Has BOM: ${source.charCodeAt(0) === 0xFEFF}`);
}
