const axios = require('axios').default;
const qs = require('qs');

const encode = require('../helpers/encode');
const removeQuote = require('../helpers/removeQuote');
const convertToLot = require('../helpers/convert-to-lot');

const { API_URL } = require('../constants');

const newOrderEndpoint = '/api/v3/order';

const maxPositions = 2;

const sendBuyOrder = async (openedPositions, usdtBalance, symbol, currentPrice, assetFilter) => {
  if (
    openedPositions.length >= maxPositions
    || usdtBalance < 11
    || openedPositions.find(({ asset }) => asset === removeQuote(symbol))
    || (!openedPositions.length && usdtBalance < 21)
  ) {
    // console.log('BUY - Do nothing', symbol, usdtBalance);
    return;
  }

  const availableBalance = !openedPositions.length ? (usdtBalance - 0.5) / maxPositions : usdtBalance - 0.5;

  const quantity = convertToLot(availableBalance / currentPrice, assetFilter.decimals);

  // console.log(quantity);

  const queryString = qs.stringify({
    quantity,
    symbol: symbol.toUpperCase(),
    side: 'BUY',
    type: 'MARKET',
    timestamp: Date.now(),
  });

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
    console.log(error, '\n', error.response.data.msg);
  }

  // console.log('BUY', symbol, `@$${currentPrice}`, availableBalance, quantity);
};

const sendSellOrder = async (openedPositions, symbol, currentPrice, assetFilter) => {
  const currentPosition = openedPositions.find(({ asset }) => asset === removeQuote(symbol));

  if (!openedPositions.length || !currentPosition) {
    // console.log('SELL - do nothing', symbol);
    return;
  }

  const { free } = currentPosition;
  const assetBalance = convertToLot(free, assetFilter.decimals);

  // console.log('SELL', symbol, `@$${currentPrice}`, assetBalance);

  const queryString = qs.stringify({
    symbol: symbol.toUpperCase(),
    side: 'SELL',
    type: 'MARKET',
    quantity: assetBalance,
    timestamp: Date.now(),
  });

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
    console.log(error, '\n', error.response.data.msg);
  }
};

module.exports = {
  sendSellOrder,
  sendBuyOrder,
};
