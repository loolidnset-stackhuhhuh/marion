import fs from 'fs';
import vm from 'vm';

const files = [
  'src/events/messageCreate.js',
  'src/events/interactionCreate.js'
];

for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');

  console.log(`\n=== Checking ${file} ===`);

  try {
    new vm.SourceTextModule(source);
    console.log('SYNTAX_OK');
  } catch (error) {
    console.log('SYNTAX_ERROR');
    console.log(error.stack || error);
  }
}
