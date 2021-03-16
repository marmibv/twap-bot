const { watchedAssets, maxOpenedPositions } = require('../../main.config');

const validateWatchedAssets = () => {
  if (!watchedAssets.length) {
    throw new Error('You need to specify watchedAssets in main.config.js');
  }

  if (!watchedAssets.every(({ smoothing, symbol, timeframe }) => (
    typeof smoothing === 'number'
    && typeof symbol === 'string'
    && typeof timeframe === 'string'
  ))) {
    throw new Error('Smoothing has to be number, symbol has to be string, timeframe has to be string');
  }

  if (!watchedAssets.every(({ smoothing }) => smoothing > 2)) {
    throw new Error('Smoothing has to be higher than 2');
  }

  if (!watchedAssets.every(({ symbol }) => symbol.endsWith('usdt'))) {
    throw new Error('Supported quote is only USDT');
  }

  if (!watchedAssets.every(({ symbol }) => symbol === symbol.toLowerCase())) {
    throw new Error('Symbol must be in lower case');
  }
};

const validateKeys = () => {
  const { API_KEY, SECRET_KEY } = process.env;

  if (
    !API_KEY
    || !API_KEY.length
    || !SECRET_KEY
    || !SECRET_KEY.length
  ) {
    throw new Error('Missing API key or SECRET key');
  }
};

const validateBaseConfig = () => {
  validateWatchedAssets();

  if (typeof maxOpenedPositions !== 'number') {
    throw new Error('MaxOpenedPositions must be number');
  }

  if (/* maxOpenedPosition >= watchedAssets.length */ maxOpenedPositions > 2 && maxOpenedPositions <= 0) {
    throw new Error('MaxOpenedPositions must be higher than 0 and less than watched assets');
  }

  validateKeys();
};

module.exports = validateBaseConfig;
