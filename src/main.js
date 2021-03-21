require('dotenv').config();

const { watchedAssets } = require('../main.config');

const { fetchOhlc } = require('./api/fetch-ohlc');
const getUserBalances = require('./api/get-user-balances');
const { sendSellOrder, sendBuyOrder } = require('./api/sendOrder');
const getAssetFilters = require('./api/get-asset-filters');
const establishBnbWss = require('./websocket/wss');

const { validateBaseConfig } = require('./helpers/validate-base-config');
const getTwapPos = require('./helpers/twap');
const getOhlc = require('./helpers/get-ohlc');
const { getOpenedPositions } = require('./helpers/get-opened-positions');
const logger = require('./helpers/logger');

const init = async (_initData) => {
  logger(
    'Watching:\n',
    _initData.map(({ symbol, timeframe, smoothing }) => `Symbol: ${symbol}\n Timeframe: ${timeframe}\n Smoothing: ${smoothing}`).join('\n'),
  );

  const ohlc = await fetchOhlc(_initData);
  const assetFilters = await getAssetFilters(_initData);

  const onMessage = async (dataJSON) => {
    if (!dataJSON || !Object.values(ohlc).length) return;

    const { stream, data } = JSON.parse(dataJSON);

    const [_streamSymbol] = stream.split('@');
    const { k: candleData } = data;

    const { ohlc: _ohlc, newCandle } = getOhlc(ohlc[_streamSymbol], candleData);

    if (newCandle) {
      const { availableBalance, tradedAssets } = await getUserBalances(_initData);
      const openedPositions = getOpenedPositions(tradedAssets, assetFilters, ohlc);

      const prevTwapPosition = getTwapPos(ohlc[_streamSymbol]);

      ohlc[_streamSymbol] = _ohlc;

      const currentOhlc = ohlc[_streamSymbol];
      const currentPrice = currentOhlc[currentOhlc.length - 1].closePrice;
      const currentAssetFilter = assetFilters[_streamSymbol.toUpperCase()];

      const twapPosition = getTwapPos(currentOhlc);

      if (twapPosition === 'below' && prevTwapPosition !== twapPosition) {
        sendBuyOrder(openedPositions, availableBalance, _streamSymbol, currentPrice, currentAssetFilter);
      } else if (twapPosition === 'above' && prevTwapPosition !== twapPosition) {
        sendSellOrder(openedPositions, _streamSymbol, currentPrice, currentAssetFilter);
      }
    }
  };

  establishBnbWss(_initData, onMessage);
};

validateBaseConfig();

init(watchedAssets);
