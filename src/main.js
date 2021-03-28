const Binance = require('node-binance-api');

require('dotenv').config();

const { watchedAssets } = require('../main.config');

const { fetchOhlc } = require('./api/fetch-ohlc');
const getUserBalances = require('./api/get-user-balances');
const { sendSellOrder, sendBuyOrder } = require('./api/sendOrder');
const getAssetFilters = require('./api/get-asset-filters');

const { validateBaseConfig } = require('./helpers/validate-base-config');
const getTwapPos = require('./helpers/twap');
const getOhlc = require('./helpers/get-ohlc');
const { getOpenedPositions } = require('./helpers/get-opened-positions');
const logger = require('./helpers/logger');

const init = async (_initData) => {
  validateBaseConfig();

  logger(
    'Watching:\n',
    _initData.map(({ symbol, timeframe, smoothing }) => `Symbol: ${symbol}\n Timeframe: ${timeframe}\n Smoothing: ${smoothing}`).join('\n'),
  );

  const binance = new Binance().options({
    APIKEY: process.env.API_KEY,
    APISECRET: process.env.SECRET_KEY,
  });

  const ohlc = await fetchOhlc(binance, _initData);
  const assetFilters = await getAssetFilters(_initData);

  binance.websockets.candlesticks(_initData.map(({ symbol }) => symbol.toUpperCase()), '1d', async (candlesticks) => {
    if (!candlesticks || !Object.values(ohlc).length) {
      return;
    }

    const { k: candleData, s: streamSymbol } = candlesticks;
    const _streamSymbol = streamSymbol.toLowerCase();

    const { ohlc: _ohlc, newCandle } = getOhlc(ohlc[_streamSymbol], candleData);

    if (newCandle) {
      const { availableBalance, tradedAssets } = await getUserBalances(binance, _initData);
      const openedPositions = getOpenedPositions(tradedAssets, assetFilters, ohlc);

      const prevTwapPosition = getTwapPos(ohlc[_streamSymbol]);

      ohlc[_streamSymbol] = _ohlc;

      const currentOhlc = ohlc[_streamSymbol];
      const currentPrice = currentOhlc[currentOhlc.length - 1].closePrice;
      const currentAssetFilter = assetFilters[_streamSymbol.toUpperCase()];

      const twapPosition = getTwapPos(currentOhlc);

      if (twapPosition === 'below' && prevTwapPosition !== twapPosition) {
        sendBuyOrder(binance, openedPositions, availableBalance, _streamSymbol, currentPrice, currentAssetFilter);
      } else if (twapPosition === 'above' && prevTwapPosition !== twapPosition) {
        sendSellOrder(binance, openedPositions, _streamSymbol, currentPrice, currentAssetFilter);
      }
    }
  });
};

init(watchedAssets);
