/* eslint-disable no-unused-vars */
const convertToNumbers = require('../helpers/convert-to-numbers');
const logger = require('../helpers/logger');

const fetchData = (binance, params, limit = null) => (
  Promise.all(
    params.map(({ symbol, timeframe, smoothing }) => (
      new Promise((resolve, reject) => {
        binance.candlesticks(symbol.toUpperCase(), timeframe, (error, ticks, _symbol) => {
          if (error) {
            reject(error);
            return;
          }

          const currentOhlcData = ticks.map(([openTime, o, h, l, c, volume, candleCloseTime]) => {
            const [open, high, low, close] = convertToNumbers([o, h, l, c]);

            return {
              closePrice: close,
              ohlc4: (open + high + low + close) / 4,
              candleCloseTime,
            };
          });

          currentOhlcData.unshift(_symbol);

          resolve(currentOhlcData);
        }, { limit: limit || smoothing });
      })
    )),
  )
);

const fetchOhlc = async (binance, params) => {
  const ohlcData = {};

  try {
    const data = await fetchData(binance, params);

    data.forEach(([symbol, ...ohlc]) => {
      ohlcData[symbol.toLowerCase()] = ohlc;
    });
  } catch (error) {
    logger(error);
  }

  return ohlcData;
};

module.exports = {
  fetchOhlc,
};
