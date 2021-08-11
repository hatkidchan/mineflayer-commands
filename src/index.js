const { logger } = require('./logger.js');
const split = require('argv-split');
const util = require('util');
const wrap = require('wordwrap')(30);

const default_filters = [
  // Handle /say command
  (bot, json) => {
    if (json.translate !== 'chat.type.announcement') return null;
    const username = json.with[0].text, text = json.with[1].text, dm = false;
    return { username, text, dm };
  }
];

const default_printer = async (bot, filtered, response) => {
  const { username, text, dm } = filtered;
  const prefix = dm ? `/w ${username} ` : '';
  if (response === undefined) return;
  for (const line of wrap(util.format(response)).split('\n')) {
    await bot.chat(prefix + line);
  }
}

function inject(bot, options) {
  bot.commands = {
    handlers: {},
    options: {
      prefix: (options?.prefix) ?? ['#'],
      filters: (options?.filters) ?? default_filters,
      printer: (options?.printer) ?? default_printer,
      unix_split: true,
    }
  };
  
  bot.commands.hook = (names, handler, helpShort, helpLong) => {
    let name, aliases = [];
    if ('string' === typeof names) { 
      name = names;
    } else {
      name = names[0];
      aliases = names.slice(1);
    }
    if (name in bot.commands.handlers)
      logger.warn(`Command name conflict: ${name}, overwriting...`);
    logger.debug(`Hooked command ${name} - ${helpShort}`);
    bot.commands.handlers[name] = { handler, helpShort, helpLong, aliases };
  };
  
  bot.commands.on = bot.commands.hook;
  
  bot.commands.loadPlugin = (plugin) => {
    plugin(bot, bot.commands);
  };
  
  bot.on('message', (json, pos) => {
    if (pos !== 'system') return;
    const prefixes = ('string' === typeof bot.commands.options.prefix
      ? [bot.commands.options.prefix] : bot.commands.options.prefix);
    for (const filter of bot.commands.options.filters) {
      let result;
      try {
        result = filter(bot, json);
      } catch (e) {
        bot.emit('command_filter_error', e, json, filter);
        return;
      }
      try {
        if (result != null) {
          const { text, username, dm } = result;
          logger.debug('Got message', result);
          for (const prefix of prefixes) {
            if (text.startsWith(prefix)) {
              const body = text.substr(prefix.length);
              const command = body.split(' ')[0].toLowerCase();
              let args;
              if (bot.commands.options.unix_split) {
                args = split(body.substr(command.length + 1));
              } else {
                args = body.substr(command.length + 1).split(' ');
              }
              bot.emit('command_received',
                command, args, username, body, json, dm, result);
              return;
            }
          }
        }
      } catch (e) {
        bot.emit('command_parse_error', e, result, json);
        return;
      }
    }
  });

  bot.on('command_received', async (cmd, args, user, body, json, dm, filt) => {
    const args_array = [ cmd, args, user, body, json, dm, filt ];
    try {
      // Not aliased
      if (cmd in bot.commands.handlers) {
        const { handler } = bot.commands.handlers[cmd];
        const result = await handler(...args_array.slice(1));
        return bot.emit('command_run_result', ...args_array, result);
      }
      
      // Alias (?)
      for (const { handler, aliases } of Object.values(bot.commands.handlers)) {
        if (aliases.includes(cmd)) {
          const result = await handler(...args_array.slice(1));
          return bot.emit('command_run_result', ...args_array, result);
        }
      }
      
      // Unknown command
      bot.emit('command_unknown', ...args_array);
    } catch (e) {
      bot.emit('command_run_error', e, ...args_array);
    }
  });
  
  bot.on('command_run_result', async (c, a, u, b, j, d, filtered, response) => {
    bot.commands.options.printer(bot, filtered, response);
  });

  return bot;
}

module.exports = { inject, default_filters };
