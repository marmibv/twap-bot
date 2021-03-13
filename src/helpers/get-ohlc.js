const nodeFetch = require('node-fetch');

const API_URL = 'https://fapi.binance.com';
const candlestickDataEndpoint = '/fapi/v1/klines';

const getOhlc = async (symbol, timeframe, smoothing) => {
  const jsonRes = await nodeFetch(`${API_URL}${candlestickDataEndpoint}?symbol=${symbol}&interval=${timeframe}`);
  const res = await jsonRes.json();

  // eslint-disable-next-line no-unused-vars
  const ohlcData = res.slice(res.length - smoothing).reduce((acc, [openTime, open, high, low, close, volume, candleCloseTime]) => (
    [
      ...acc,
      {
        c: Number(close),
        avgPrice: (Number(open) + Number(high) + Number(low) + Number(close)) / 4,
        candleCloseTime: new Date(candleCloseTime),
      },
    ]
  ), []);

  return ohlcData;
};

module.exports = getOhlc;
