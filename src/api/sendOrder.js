const axios = require('axios').default;
const qs = require('qs');

const sendMessage = require('../discord-client/discord-client');
const encode = require('../helpers/encode');
const removeQuote = require('../helpers/removeQuote');
const floor = require('../helpers/floor');
const logger = require('../helpers/logger');

const { maxOpenedPositions } = require('../../main.config');
const { API_URL } = require('../constants');

const newOrderEndpoint = '/api/v3/order';

const entries = {};

const createQueryString = (symbol, side, quantity) => (
  qs.stringify({
    quantity,
    side,
    symbol: symbol.toUpperCase(),
    type: 'MARKET',
    timestamp: Date.now(),
  })
);

const sendBuyOrder = async (openedPositions, usdtBalance, symbol, currentPrice, assetFilter) => {
  if (
    openedPositions.length >= maxOpenedPositions
    || usdtBalance < 11
    || openedPositions.find(({ asset }) => asset === removeQuote(symbol))
    || (!openedPositions.length && usdtBalance < 21)
  ) {
    logger('BUY - Do nothing', symbol, usdtBalance);
    return;
  }

  // FIX: Support for more than 2 opened positions
  const availableBalance = !openedPositions.length ? (usdtBalance - 0.5) / maxOpenedPositions : usdtBalance - 0.5;

  const quantity = floor(availableBalance / currentPrice, assetFilter.decimals);

  const queryString = createQueryString(symbol, 'BUY', quantity);
  const sign = encode(queryString);

  try {
    const res = await axios({
      method: 'POST',
      url: `${API_URL}${newOrderEndpoint}?${queryString}&signature=${sign}`,
      headers: {
        'X-MBX-APIKEY': process.env.API_KEY,
      },
    });

    if (res.status !== 200) {
      throw new Error(res.message);
    }
  } catch (error) {
    logger(error, '\n', error.response.data.msg);
  }

  entries[symbol] = currentPrice;

  logger('BUY', symbol, `@$${currentPrice}`, availableBalance, quantity);

  if (sendMessage) {
    sendMessage(`Bought ${quantity} ${removeQuote(symbol).toUpperCase()} @ $${currentPrice}`);
  }
};

const sendSellOrder = async (openedPositions, symbol, currentPrice, assetFilter) => {
  const currentPosition = openedPositions.find(({ asset }) => asset === removeQuote(symbol));

  if (!openedPositions.length || !currentPosition) {
    logger('SELL - do nothing', symbol);
    return;
  }

  const { free } = currentPosition;
  const assetBalance = floor(free, assetFilter.decimals);

  const queryString = createQueryString(symbol, 'SELL', assetBalance);
  const sign = encode(queryString);

  try {
    const res = await axios({
      method: 'POST',
      url: `${API_URL}${newOrderEndpoint}?${queryString}&signature=${sign}`,
      headers: {
        'X-MBX-APIKEY': process.env.API_KEY,
      },
    });

    if (res.status !== 200) {
      throw new Error(res.message);
    }
  } catch (error) {
    logger(error, '\n', error.response.data.msg);
  }

  const pnl = (currentPrice / entries[symbol] - 1) * 100;

  logger('SELL', symbol, `@$${currentPrice}`, assetBalance);

  if (sendMessage) {
    sendMessage(`Sold ${assetBalance} ${removeQuote(symbol).toUpperCase()} @ $${currentPrice}\n${Number.isNaN(pnl) ? '' : `PnL: ${pnl}%`}`);
  }
};

module.exports = {
  sendSellOrder,
  sendBuyOrder,
};
