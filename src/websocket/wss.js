const WebSocket = require('ws');

const logger = require('../helpers/logger');

const { WSS_URL } = require('../constants');

/**
 * @param {Array<{symbol: string; timeframe: string; smoothing: number}>} params
 */
const connectToWs = (params) => {
  const streams = params.map(({ symbol, timeframe }) => `${symbol}@kline_${timeframe}`).join('/');

  const bnbWss = new WebSocket(`${WSS_URL}/stream?streams=${streams}`, {
    method: 'SUBSCRIBE',
    id: 1,
  });

  bnbWss.on('open', () => {
    logger('\nConnected');
  });

  return bnbWss;
};

module.exports = connectToWs;
