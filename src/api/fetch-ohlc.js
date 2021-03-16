/* eslint-disable no-unused-vars */
const axios = require('axios');

const { API_URL } = require('../constants');

const convertToNumbers = require('../helpers/convert-to-numbers');
const logger = require('../helpers/logger');

const candlestickDataEndpoint = '/api/v3/klines';

/**
 * @param {Array<{symbol: string; timeframe: string; smoothing: number}>} params
 */
const fetchData = async (params) => {
  let ohlcData;

  try {
    ohlcData = await Promise.all(
      params.map(({ symbol, timeframe }) => (
        axios(`${API_URL}${candlestickDataEndpoint}?symbol=${symbol.toUpperCase()}&interval=${timeframe}`)
      )),
    );
  } catch (error) {
    logger(error);
    throw new Error(`${error.response.data.msg.toUpperCase()}`);
  }

  return ohlcData;
};

/**
 * @param {Array<{symbol: string; timeframe: string; smoothing: number}>} params
 */
const fetchOhlc = async (params) => {
  const ohlcAll = await fetchData(params);

  const ohlcData = ohlcAll.reduce((acc, { data: currentOhlc }, i) => {
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

module.exports = {
  fetchData,
  fetchOhlc,
};
