/* eslint-disable no-console */
const { logOutput } = require('../../main.config');

const logger = (logType = 'info', ...args) => {
  if (!logOutput && !process.env.LOG_OUTPUT) {
    return;
  }

  if (logType !== 'info' && logType !== 'log' && logType !== 'error' && logType !== 'warn') {
    console.log(...args);
  }

  console[logType](...args);
};

module.exports = logger;
