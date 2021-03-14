const { fetchOhlc } = require('./api/fetch-ohlc');
const getUserPositions = require('./api/get-user-positions');
const { sendSellOrder, sendBuyOrder } = require('./api/sendOrder');
const getAssetFilters = require('./api/get-asset-filters');
const establishBnbWss = require('./websocket/wss');

const getTwapPos = require('./helpers/twap');
const getOhlc = require('./helpers/get-ohlc');
const { getOpenedPositions } = require('./helpers/get-opened-positions');

require('dotenv').config();

const initData = [
  {
    symbol: 'btcusdt',
    timeframe: '4h',
    smoothing: 20,
  },
];

const init = async (_initData) => {
  console.log(
    'Watching:\n',
    initData.map(({ symbol, timeframe, smoothing }) => `Symbol: ${symbol}\n Timeframe: ${timeframe}\n Smoothing: ${smoothing}`).join('\n'),
  );

  const ohlc = await fetchOhlc(_initData);
  const assetFilters = await getAssetFilters(_initData);

  const bnbWss = establishBnbWss(_initData);

  bnbWss.on('message', async (dataJSON) => {
    if (!dataJSON || !Object.values(ohlc).length) return;
    const { stream, data } = JSON.parse(dataJSON);

    const [_streamSymbol] = stream.split('@');
    const { k } = data;

    const { ohlc: _ohlc, newCandle } = getOhlc(ohlc[_streamSymbol], k);

    if (newCandle) {
      const { availableBalance, ownedAssets } = await getUserPositions(_initData);
      const openedPositions = getOpenedPositions(ownedAssets, assetFilters, ohlc);

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
  });
};

init(initData);
