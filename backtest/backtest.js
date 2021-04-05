/* eslint-disable no-plusplus */
/* eslint-disable no-unused-vars */
/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
const { v4: uuidv4 } = require('uuid');

const Binance = require('../src/api/binance-api');

const convertToNumbers = require('../src/helpers/convert-to-numbers');
const getTwapPos = require('../src/helpers/twap');
const logger = require('../src/helpers/logger');

const capital = 1000;
const candles = 20;

const initData = [
  {
    capital,
    symbol: 'btcusdt',
    timeframe: '4h',
    smoothing: 20,
  },
];

const binance = new Binance({
  API_KEY: process.env.API_KEY,
  SECRET_KEY: process.env.SECRET_KEY,
  watchedAssets: initData,
});

let entry = {};

const test = async () => {
  const rawData = await binance.fetchOhlc(candles);

  const markets = rawData
    .reduce((acc, market, i) => (
      {
        ...acc,
        [uuidv4()]: market
          .map(([openTime, o, h, l, c, volume, candleCloseTime]) => {
            const [open, high, low, close] = convertToNumbers([o, h, l, c]);

            return {
              closePrice: close,
              ohlc4: (open + high + low + close) / 4,
              candleCloseTime,
            };
          }),
      }
    ), {});

  let j = 0;

  for (const market in markets) {
    const ohlcValues = markets[market];
    logger('info', 'Start date: ', new Date(ohlcValues[0].candleCloseTime));

    for (let i = initData[j].smoothing; i < ohlcValues.length; i++) {
      const prevOhlc = ohlcValues.slice(i - initData[j].smoothing, i);
      const ohlc = ohlcValues.slice(i - initData[j].smoothing + 1, i + 1);

      const prevTwapPosition = getTwapPos(prevOhlc);
      const currentTwapPosition = getTwapPos(ohlc);

      const { symbol: currentSymbol, timeframe, smoothing } = initData[j];

      if (currentTwapPosition === 'below' && prevTwapPosition !== currentTwapPosition) {
        entry = {
          symbol: currentSymbol,
          price: ohlc[ohlc.length - 1].closePrice,
          type: 'long',
        };

        // logger(
        //   'info',
        //   'BUY',
        //   'Symbol:', currentSymbol,
        //   'Timeframe:', timeframe,
        //   'Smoothing:', smoothing,
        //   `@$${ohlc[ohlc.length - 1].closePrice}`,
        //   'Date:', new Date(ohlc[ohlc.length - 1].candleCloseTime),
        // );
      } else if (currentTwapPosition === 'above' && prevTwapPosition !== currentTwapPosition) {
        if (currentSymbol !== entry.symbol) {
          // eslint-disable-next-line no-continue
          continue;
        }

        if (entry && entry.type === 'long') {
          const entryPrice = entry.price;
          const currentPrice = ohlc[ohlc.length - 1].closePrice;

          const pnl = currentPrice / entryPrice;

          initData[j].capital *= pnl;

          entry.price = currentPrice;
          entry.type = 'short';

          // logger(
          //   'info',
          //   'SELL',
          //   'Symbol:', currentSymbol,
          //   'Timeframe:', timeframe,
          //   'Smoothing:', smoothing,
          //   `@$${ohlc[ohlc.length - 1].closePrice}`,
          //   'PnL:', `${((pnl - 1) * 100).toFixed(2)}%`,
          //   'Date:', new Date(ohlc[ohlc.length - 1].candleCloseTime),
          //   '\n',
          // );
        }
      }
    }

    logger(
      'info',
      'LAST TRADE:',
      initData[j].symbol,
      entry.price,
      entry.type,
    );

    j++;
  }

  initData.forEach(({
    capital: _capital, symbol, timeframe, smoothing,
  }) => {
    logger(
      'info',
      'Symbol:', symbol.toUpperCase(),
      'Timeframe:', timeframe,
      'Smoothing:', smoothing,
      'Initial capital:', capital,
      'Current capital:', _capital,
    );
  });
};

test();
