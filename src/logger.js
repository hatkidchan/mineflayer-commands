let log4js, logger, is_log4js = false;
try {
  log4js = require('log4js');
  logger = log4js.getLogger('commands');
  is_log4js = true;
} catch (e) {
  // No log4js available, falling back to console
  const util = require('util');
  const make_logger = (level, funcname=null) => {
    funcname = funcname || level;
    return function() {
      let args = Array.from(arguments);
      if (logger.levels[level] >= logger.levels[logger.level]) {
        const format = args.splice(0, 1)[0];
        let message = util.format(format, ...args);
        if (logger.use_colors) {
          message = logger.colors[level] + message + logger.colors.reset;
        }
        console[funcname].apply(console, [message]);
      }
    }
  };
  logger = {
    level: 'info',
    use_colors: true,
    levels: {
      trace: 0,
      debug: 1000,
      info: 2000,
      warn: 3000,
      error: 4000,
      fatal: 5000
    },
    colors: {
      trace: '\u001b[90m',
      debug: '\u001b[36m',
      info: '\u001b[32m',
      warn: '\u001b[33m',
      error: '\u001b[31m',
      fatal: '\u001b[91m',
      reset: '\u001b[0m'
    },
    trace: make_logger('trace'),
    debug: make_logger('debug'),
    info: make_logger('info'),
    warn: make_logger('warn'),
    error: make_logger('error'),
    fatal: make_logger('fatal', 'error')
  }
}

module.exports = { logger, is_log4js };
