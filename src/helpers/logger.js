const { logOutput } = require('../../main.config');

const logger = (...args) => {
  if (!logOutput && !process.env.LOG_OUTPUT) {
    return;
  }

  console.log(...args);
};

module.exports = logger;
