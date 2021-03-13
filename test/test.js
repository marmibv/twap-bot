/* eslint-disable no-plusplus */
/* eslint-disable no-unused-vars */
/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
const { fetchData } = require('../src/helpers/fetch-ohlc');
const convertToNumbers = require('../src/helpers/convert-to-numbers');
const getTwapPos = require('../src/helpers/twap');

const capital = 50;

const initData = [
  {
    capital,
    symbol: 'sushiusdt',
    timeframe: '1d',
    smoothing: 20,
  },
  {
    capital,
    symbol: 'aaveusdt',
    timeframe: '1d',
    smoothing: 20,
  },
  {
    capital,
    symbol: 'grtusdt',
    timeframe: '1d',
    smoothing: 20,
  },
  {
    capital,
    symbol: 'crvusdt',
    timeframe: '1d',
    smoothing: 20,
  },
  {
    capital,
    symbol: 'sushiusdt',
    timeframe: '15m',
    smoothing: 14,
  },
  {
    capital,
    symbol: 'btcusdt',
    timeframe: '4h',
    smoothing: 20,
  },
];

const entries = {};

const test = async () => {
  const rawData = await fetchData(initData);

  const markets = rawData
    .reduce((acc, market, i) => {
      console.log('Start date:', new Date(market[0][0]), market[0][0]);

      return {
        ...acc,
        [`${initData[i].symbol}-${initData[i].timeframe}`]: market
          .slice(market.length - 201 > 0 ? market.length - 201 : 0, market.length)
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

      const { symbol: currentSymbol, timeframe } = initData[j];

      if (currentTwapPosition === 'below' && prevTwapPosition !== currentTwapPosition) {
        entries[currentSymbol] = {
          price: ohlc[ohlc.length - 1].closePrice,
          type: 'long',
        };

        console.log(
          'BUY',
          'Symbol:', currentSymbol,
          'Timeframe:', timeframe,
          `@$${ohlc[ohlc.length - 1].closePrice}`,
          'Date:', new Date(ohlc[ohlc.length - 1].candleCloseTime),
        );
      } else if (currentTwapPosition === 'above' && prevTwapPosition !== currentTwapPosition) {
        if (entries[currentSymbol] && entries[currentSymbol].type === 'long') {
          const entryPrice = entries[currentSymbol].price;
          const currentPrice = ohlc[ohlc.length - 1].closePrice;

          const pnl = currentPrice / entryPrice;

          initData[j].capital *= pnl;

          entries[currentSymbol].type = 'short';

          console.log(
            'SELL',
            'Symbol:', currentSymbol,
            'Timeframe:', timeframe,
            `@$${ohlc[ohlc.length - 1].closePrice}`,
            'PnL:', `${((pnl - 1) * 100).toFixed(2)}%`,
            'Date:', new Date(ohlc[ohlc.length - 1].candleCloseTime),
            '\n',
          );
        }
      }
    }

    j++;
  }

  initData.forEach(({ capital: _capital, symbol, timeframe }) => {
    console.log(
      'Symbol:', symbol.toUpperCase(),
      'Timeframe:', timeframe,
      'Initial capital:', capital,
      'Current capital:', _capital,
    );
  });
};

test();
