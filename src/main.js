require('dotenv').config();

const {
  watchedAssets, maxOpenedPositions, discordDMChannelId, discordUserId,
} = require('../main.config');

const Binance = require('./api/binance-api');
const initDiscordBot = require('./discord-client/discord-client');

const { validateBaseConfig } = require('./helpers/validate-base-config');
const getTwapPos = require('./helpers/twap');
const getOhlc = require('./helpers/get-ohlc');
const logger = require('./helpers/logger');

const init = async (_initData) => {
  validateBaseConfig();

  logger(
    'info',
    'Watching:\n',
    _initData.map(({ symbol, timeframe, smoothing }) => `Symbol: ${symbol}\n Timeframe: ${timeframe}\n Smoothing: ${smoothing}`).join('\n'),
    '\nMax positions opened:',
    maxOpenedPositions,
  );

  const discordBot = initDiscordBot({
    discordDMChannelId,
    discordUserId,
    DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN,
  });

  const binance = new Binance({
    maxOpenedPositions,
    API_KEY: process.env.API_KEY,
    SECRET_KEY: process.env.SECRET_KEY,
    watchedAssets: _initData,
    sendDiscordMessage: discordBot.sendDiscordMessage,
  });

  await binance.init();

  const ohlc = await binance.getOhlc();

  binance.watchCandlesticks(async (data) => {
    const { data: candlesticks } = JSON.parse(data);

    if (!candlesticks || !Object.values(ohlc).length) {
      return;
    }

    const { k: candleData, s: streamSymbol } = candlesticks;
    const _streamSymbol = streamSymbol.toLowerCase();

    const { ohlc: _ohlc, newCandle } = getOhlc(ohlc[_streamSymbol], candleData);

    if (newCandle) {
      const prevTwapPosition = getTwapPos(ohlc[_streamSymbol]);

      ohlc[_streamSymbol] = _ohlc;

      const currentOhlc = ohlc[_streamSymbol];
      const twapPosition = getTwapPos(currentOhlc);

      if (twapPosition === 'below' && prevTwapPosition !== twapPosition) {
        await binance.sendOrder('BUY', ohlc, _streamSymbol);
      } else if (twapPosition === 'above' && prevTwapPosition !== twapPosition) {
        await binance.sendOrder('SELL', ohlc, _streamSymbol);
      }
    }
  });
};

init(watchedAssets);
