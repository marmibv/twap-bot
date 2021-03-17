/* eslint-disable no-plusplus */
/* eslint-disable no-unused-vars */
/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
const { v4: uuidv4 } = require('uuid');

const { fetchData } = require('../src/api/fetch-ohlc');
const convertToNumbers = require('../src/helpers/convert-to-numbers');
const getTwapPos = require('../src/helpers/twap');
const logger = require('../src/helpers/logger');

const capital = 1000;
const candles = 201;

const initData = [
  {
    capital,
    symbol: 'injusdt',
    timeframe: '1d',
    smoothing: 15,
  },
  {
    capital,
    symbol: 'injusdt',
    timeframe: '1d',
    smoothing: 20,
  },
  {
    capital,
    symbol: 'injusdt',
    timeframe: '1d',
    smoothing: 30,
  },
  {
    capital,
    symbol: 'injusdt',
    timeframe: '1d',
    smoothing: 35,
  },
];

let entry = {};

const test = async () => {
  const rawData = await fetchData(initData);

  const markets = rawData
    .reduce((acc, { data: market }, i) => {
      logger('Start date:', initData[i].symbol.toUpperCase(), new Date(market[0][0]));

      return {
        ...acc,
        [uuidv4()]: market
          .slice(market.length - candles > 0 ? market.length - candles : 0, market.length)
          .map(([openTime, o, h, l, c, volume, candleCloseTime]) => {
            const [open, high, low, close] = convertToNumbers([o, h, l, c]);

            return {
              closePrice: close,
              ohlc4: (open + high + low + close) / 4,
              candleCloseTime,
            };
          }),
      };
    }, {});

  let j = 0;

  for (const market in markets) {
    const ohlcValues = markets[market];

    for (let i = initData[j].smoothing; i < ohlcValues.length; i++) {
      const prevOhlc = ohlcValues.slice(i - initData[j].smoothing, i);
      const ohlc = ohlcValues.slice(i - initData[j].smoothing + 1, i + 1);

      const prevTwapPosition = getTwapPos(prevOhlc);
      const currentTwapPosition = getTwapPos(ohlc);

      const { symbol: currentSymbol, timeframe, smoothing } = initData[j];

      if (currentTwapPosition === 'below' && prevTwapPosition !== currentTwapPosition) {
        entry = {
          price: ohlc[ohlc.length - 1].closePrice,
          type: 'long',
        };

        // logger(
        //   'BUY',
        //   'Symbol:', currentSymbol,
        //   'Timeframe:', timeframe,
        //   'Smoothing:', smoothing,
        //   `@$${ohlc[ohlc.length - 1].closePrice}`,
        //   'Date:', new Date(ohlc[ohlc.length - 1].candleCloseTime),
        // );
      } else if (currentTwapPosition === 'above' && prevTwapPosition !== currentTwapPosition) {
        if (entry && entry.type === 'long') {
          const entryPrice = entry.price;
          const currentPrice = ohlc[ohlc.length - 1].closePrice;

          const pnl = currentPrice / entryPrice;

          initData[j].capital *= pnl;

          entry.price = currentPrice;
          entry.type = 'short';

          // logger(
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
      'Symbol:', symbol.toUpperCase(),
      'Timeframe:', timeframe,
      'Smoothing:', smoothing,
      'Initial capital:', capital,
      'Current capital:', _capital,
    );
  });
};

test();
