const EventEmitter = require('events');
const bot = new EventEmitter();
const plugin = require('../src/index.js');
const { logger } = require('../src/logger.js');

plugin.inject(bot, {
  prefix: [ '#', 'pls ', '!' ]
});

bot.commands.loadPlugin((b, c) => {
  c.hook('ping', () => {
    return 'Pong!';
  });
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

const chat = (name, text) => ({
  'translate': 'chat.type.announcement',
  'with': [{'text': name}, {'text': text}]
});

bot.on('message', create_handler('message', 'info', ['pos', 'json']));
bot.on('command_filter_error', create_handler('command_filter_error', 'error', ['e', 'json', 'filter']));
bot.on('command_parse_error', create_handler('command_parse_error', 'error', ['e', 'result', 'json']));
bot.on('command_run_error', create_handler('command_run_error', 'error', ['e', 'cmd', 'args', 'user', 'body', 'json', 'dm', 'filtered']));
bot.on('command_received', create_handler('command_received', 'info', ['cmd', 'args', 'user', 'body', 'json', 'dm', 'filtered']));
bot.on('command_run_result', create_handler('command_run_result', 'info', ['cmd', 'args', 'user', 'body', 'json', 'dm', 'filtered', 'result']));
bot.on('command_unknown', create_handler('command_unknown', 'warn', ['cmd', 'args', 'user', 'body', 'json', 'dm', 'filtered']));

bot.chat = (text) => { logger.info('Chat:', text); }


bot.emit('message', chat('hatkidchan', 'pls ping'), 'system');
bot.emit('message', chat('hatkidchan', 'pls what'), 'system');
bot.emit('message', chat('hatkidchan', 'pls should be "invalid'), 'system')
