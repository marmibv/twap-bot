const fetchOhlc = require('./helpers/fetch-ohlc');
const establishBnbWss = require('./helpers/wss');
const getTwapPos = require('./helpers/twap');
const getOhlc = require('./helpers/get-ohlc');

require('dotenv').config();

const initData = [
  {
    timeframe: '1m',
    symbol: 'btcusdt',
    smoothing: 20,
  },
  {
    timeframe: '1m',
    symbol: 'sushiusdt',
    smoothing: 20,
  },
];

const init = async (_initData) => {
  console.log(
    'Watching:\n',
    initData.map(({ symbol, timeframe, smoothing }) => `Symbol: ${symbol}\n Timeframe: ${timeframe}\n Smoothing: ${smoothing}`).join('\n'),
  );

  const ohlc = await fetchOhlc(_initData);

  const bnbWss = establishBnbWss(_initData);

  bnbWss.on('message', (dataJSON) => {
    if (!dataJSON) return;
    const { stream, data } = JSON.parse(dataJSON);

    const [_streamSymbol] = stream.split('@');
    const { k } = data;

    const { ohlc: _ohlc, newCandle } = getOhlc(ohlc[_streamSymbol], k);

    if (newCandle) {
      const prevTwapPosition = getTwapPos(ohlc[_streamSymbol]);

      ohlc[_streamSymbol] = _ohlc;

      const twapPosition = getTwapPos(ohlc[_streamSymbol]);

      if (twapPosition === 'below' && prevTwapPosition !== twapPosition) {
        // BUY
        console.log('BUY', _streamSymbol.toUpperCase(), `@$${ohlc[_streamSymbol][ohlc.length - 1].closePrice}`);
      } else if (twapPosition === 'above' && prevTwapPosition !== twapPosition) {
        // SELL
        console.log('SELL', _streamSymbol.toUpperCase(), `@$${ohlc[_streamSymbol][ohlc.length - 1].closePrice}`);
      }
    }
  });
};

init(initData);
