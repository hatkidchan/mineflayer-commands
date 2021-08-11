const { logger, is_log4js } = require('../src/logger.js');
if (is_log4js) {
  console.log('Using log4js, skipping tests...');
}

logger.level = 'trace';
logger.trace("Entering cheese testing");
logger.debug("Got cheese.");
logger.info("Cheese is Comté.");
logger.warn("Cheese is quite smelly.");
logger.error("Cheese is too ripe!");
logger.fatal("Cheese was breeding ground for listeria.");
