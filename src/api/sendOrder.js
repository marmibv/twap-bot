const sendMessage = require('../discord-client/discord-client');
const removeQuote = require('../helpers/removeQuote');
const floor = require('../helpers/floor');
const logger = require('../helpers/logger');

const { maxOpenedPositions } = require('../../main.config');

const entries = {};

const sendBuyOrder = async (binance, openedPositions, usdtBalance, symbol, currentPrice, assetFilter) => {
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

  try {
    binance.marketBuy(symbol.toUpperCase(), quantity);
  } catch (error) {
    logger(error, '\n', error.response.data.msg);
  }

  entries[symbol] = currentPrice;

  if (sendMessage) {
    sendMessage(`Bought ${quantity} ${removeQuote(symbol).toUpperCase()} @ $${currentPrice}`);
  }
  logger('BUY', symbol, `@$${currentPrice}`, availableBalance, quantity);
};

const sendSellOrder = async (binance, openedPositions, symbol, currentPrice, assetFilter) => {
  const currentPosition = openedPositions.find(({ asset }) => asset === removeQuote(symbol));

  if (!openedPositions.length || !currentPosition) {
    logger('SELL - do nothing', symbol);
    return;
  }

  const { free } = currentPosition;
  const assetBalance = floor(free, assetFilter.decimals);

  try {
    binance.marketSell(symbol.toUpperCase(), assetBalance);
  } catch (error) {
    logger(error, '\n', error.response.data.msg);
  }

  const pnl = (currentPrice / entries[symbol] - 1) * 100;

  if (sendMessage) {
    sendMessage(`Sold ${assetBalance} ${removeQuote(symbol).toUpperCase()} @ $${currentPrice}\n${
      Number.isNaN(pnl) ? '' : `PnL: ${pnl.toFixed(2)}%`
    }`);
  }
  logger('SELL', symbol, `@$${currentPrice}`, assetBalance);
};

module.exports = {
  sendSellOrder,
  sendBuyOrder,
};
