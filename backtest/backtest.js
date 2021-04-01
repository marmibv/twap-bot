/* eslint-disable no-plusplus */
/* eslint-disable no-unused-vars */
/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
const Binance = require('node-binance-api');
const { v4: uuidv4 } = require('uuid');

const { fetchData } = require('../src/api/fetch-ohlc');
const convertToNumbers = require('../src/helpers/convert-to-numbers');
const getTwapPos = require('../src/helpers/twap');
const logger = require('../src/helpers/logger');

const binance = new Binance().options({
  APIKEY: process.env.API_KEY,
  APISECRET: process.env.SECRET_KEY,
});

const capital = 20;
const candles = 201;

const initData = [
  {
    capital,
    symbol: 'btcusdt',
    timeframe: '4h',
    smoothing: 20,
  },
];

let entry = {};

const test = async () => {
  const rawData = await fetchData(binance, initData, 500);
  const markets = rawData
    .reduce((acc, [token, ...market], i) => (
      {
        ...acc,
        [uuidv4()]: market,
      }
    ), {});

  let j = 0;

  for (const market in markets) {
    const ohlcValues = markets[market];
    logger('Start date: ', new Date(ohlcValues[0].candleCloseTime));

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
