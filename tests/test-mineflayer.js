const { logger } = require('../src/logger.js');
logger.level = 'debug';
const bot = require('mineflayer').createBot({
  username: 'test',
  host: process.argv[2],
  port: process.argv[3]
});

const create_handler = (name, level='info', names=null) => {
  if (names === null) {
    return function() {
      logger[level](name + ':', ...Array.from(arguments));
    }
  } else {
    return function() {
      let params = {};
      for (let i = 0; i < arguments.length; i++) {
        params[names[i]] = arguments[i];
      }
      logger[level](name + ':', params);
    }
  }
}

bot.on('message', create_handler('message', 'info', ['json', 'pos']));
bot.on('command_filter_error', create_handler('command_filter_error', 'error', ['e', 'json', 'filter']));
bot.on('command_parse_error', create_handler('command_parse_error', 'error', ['e', 'result', 'json']));
bot.on('command_run_error', create_handler('command_run_error', 'error', ['e', 'cmd', 'args', 'user', 'body', 'json', 'dm', 'filtered']));
bot.on('command_received', create_handler('command_received', 'info', ['cmd', 'args', 'user', 'body', 'json', 'dm', 'filtered']));
bot.on('command_run_result', create_handler('command_run_result', 'info', ['cmd', 'args', 'user', 'body', 'json', 'dm', 'filtered', 'result']));
bot.on('command_unknown', create_handler('command_unknown', 'warn', ['cmd', 'args', 'user', 'body', 'json', 'dm', 'filtered']));

bot.once('spawn', () => {
  console.log('Spawned!');
  require('../index.js')(bot, {
    prefix: [ '>>' ]
  });
  bot.commands.loadPlugin((b, c) => {
    c.on('ping', () => { return 'Pong!'; });
    c.on(['whoami', 'who'], (_, name) => { return `You're ${name}!` });
    c.on('args', (args) => { return JSON.stringify(args); });
    c.on('everything', (args, username, body, json, is_dm, filtered) => {
      return JSON.stringify({args, username, body, json, is_dm, filtered});
    });
  });
  
  bot.chat('/login testt');
});
