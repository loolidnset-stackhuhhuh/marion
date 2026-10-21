import('./src/events/messageCreate.js')
  .then(() => console.log('MESSAGE_OK'))
  .catch(error => console.error('MESSAGE_ERROR', error.stack || error));

import('./src/events/interactionCreate.js')
  .then(() => console.log('INTERACTION_OK'))
  .catch(error => console.error('INTERACTION_ERROR', error.stack || error));
