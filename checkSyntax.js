import('./src/events/messageCreate.js')
  .then(() => console.log('messageCreate.js: OK'))
  .catch(error => {
    console.error('messageCreate.js ERROR:');
    console.error(error.stack || error);
  });

import('./src/events/interactionCreate.js')
  .then(() => console.log('interactionCreate.js: OK'))
  .catch(error => {
    console.error('interactionCreate.js ERROR:');
    console.error(error.stack || error);
  });
