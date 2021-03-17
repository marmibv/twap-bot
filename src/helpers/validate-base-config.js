const { watchedAssets, maxOpenedPositions } = require('../../main.config');

const validateWatchedAssets = (_watchedAssets) => {
  if (!_watchedAssets.length) {
    throw new Error('You need to specify watchedAssets in main.config.js');
  }

  if (!_watchedAssets.every((asset) => (
    Object.prototype.hasOwnProperty.call(asset, 'symbol')
    && Object.prototype.hasOwnProperty.call(asset, 'timeframe')
    && Object.prototype.hasOwnProperty.call(asset, 'smoothing')
  ))) {
    throw new Error('Every asset should contain symbol, timeframe and smoothing');
  }

  if (!_watchedAssets.every(({ smoothing, symbol, timeframe }) => (
    typeof smoothing === 'number'
    && typeof symbol === 'string'
    && typeof timeframe === 'string'
  ))) {
    throw new Error('Smoothing has to be number, symbol has to be string, timeframe has to be string');
  }

  if (!_watchedAssets.every(({ symbol }) => symbol === symbol.toLowerCase())) {
    throw new Error('Symbol must be in lower case');
  }

  if (!_watchedAssets.every(({ symbol }) => symbol.endsWith('usdt'))) {
    throw new Error('Supported quote is only USDT');
  }

  const timeframes = ['1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '8h', '12h', '1d', '3d', '1w', '1M'];

  if (!_watchedAssets.every(({ timeframe }) => timeframes.some((tf) => tf === timeframe))) {
    throw new Error('Ivalid timeframe');
  }

  if (!_watchedAssets.every(({ smoothing }) => smoothing > 2)) {
    throw new Error('Smoothing has to be higher than 2');
  }
};

const validateMaxOpenedPositions = (_maxOpenedPositions) => {
  if (typeof _maxOpenedPositions !== 'number') {
    throw new Error('MaxOpenedPositions must be number');
  }

  if (/* maxOpenedPosition >= watchedAssets.length */ _maxOpenedPositions > 2 || _maxOpenedPositions <= 0) {
    throw new Error('MaxOpenedPositions must be higher than 0 and less than 2');
  }
};

const validateKeys = ({ API_KEY, SECRET_KEY }) => {
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
  validateWatchedAssets(watchedAssets);

  validateMaxOpenedPositions(maxOpenedPositions);

  validateKeys(process.env);
};

module.exports = {
  validateBaseConfig,
  validateWatchedAssets,
  validateMaxOpenedPositions,
  validateKeys,
};
