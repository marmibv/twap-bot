const WebSocket = require('ws');

const logger = require('../helpers/logger');

const { WSS_URL } = require('../constants');

/**
 * @param {Array<{symbol: string; timeframe: string; smoothing: number}>} params
 */
const connectToWs = (params, onMessageFn) => {
  const streams = params.map(({ symbol, timeframe }) => `${symbol}@kline_${timeframe}`).join('/');

  const initWs = () => {
    const bnbWs = new WebSocket(`${WSS_URL}/stream?streams=${streams}`, {
      method: 'SUBSCRIBE',
      id: 1,
    });

    bnbWs.on('open', () => {
      logger('\nConnected');
    });

    bnbWs.on('message', onMessageFn);

    bnbWs.on('close', () => {
      initWs();
    });
  };

  initWs();
};

module.exports = connectToWs;
