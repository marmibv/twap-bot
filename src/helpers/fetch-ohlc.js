/* eslint-disable no-unused-vars */
const nodeFetch = require('node-fetch');
const convertToNumbers = require('./convert-to-numbers');

const API_URL = 'https://fapi.binance.com';
const candlestickDataEndpoint = '/fapi/v1/klines';

/**
 *
 * @param {Array<{symbol: string; timeframe: string; smoothing: number}>} params
 */
const fetchOhlc = async (params) => {
  const ohlcAll = await Promise.all(
    params.map(({ symbol, timeframe }) => (
      nodeFetch(`${API_URL}${candlestickDataEndpoint}?symbol=${symbol}&interval=${timeframe}`).then((res) => res.json())
    )),
  );

  const ohlcData = ohlcAll.reduce((acc, currentOhlc, i) => {
    // eslint-disable-next-line no-underscore-dangle
    const _currentOhlc = currentOhlc
      .slice(currentOhlc.length - params[i].smoothing)
      .map(([openTime, o, h, l, c, volume, candleCloseTime]) => {
        const [open, high, low, close] = convertToNumbers([o, h, l, c]);

        return {
          closePrice: close,
          ohlc4: (open + high + low + close) / 4,
          candleCloseTime,
        };
      });

    return {
      ...acc,
      [params[i].symbol]: _currentOhlc,
    };
  }, {});

  return ohlcData;
};

module.exports = fetchOhlc;
