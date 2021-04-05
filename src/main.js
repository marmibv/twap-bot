require('dotenv').config();

const {
  watchedAssets, maxOpenedPositions, discordDMChannelId, discordUserId,
} = require('../main.config');

const Binance = require('./api/binance-api');
const initDiscordBot = require('./discord-client/discord-client');

const { validateBaseConfig } = require('./helpers/validate-base-config');
const getTwapPos = require('./helpers/twap');
const getOhlc = require('./helpers/get-ohlc');
const removeQuote = require('./helpers/removeQuote');
const calculatePnl = require('./helpers/calculate-pnl');
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

  if (discordBot.setResponseMessage) {
    discordBot.setResponseMessage([
      '!connection',
      (msg) => {
        const wsState = binance.ws?.readyState;

        if (wsState === 1) {
          msg.channel.send('Websocket is connected! :white_check_mark:');
          return;
        }

        if (!wsState || wsState === 2 || wsState === 3) {
          msg.channel.send('Websocket is not connected! ⚠');
        }
      },
    ]);

    discordBot.setResponseMessage([
      '!opened-positions',
      async (msg) => {
        const activePositions = binance.positions;

        if (!Object.keys(activePositions).length) {
          const { openedPositions } = await binance.getAccountBalances(ohlc);

          if (!openedPositions.length) {
            msg.channel.send('No positions opened.');
            return;
          }

          const response = `Opened positions: (PnLs will not be shown as positions were not opened by this bot)\n${
            openedPositions.reduce((acc, { asset, free }) => {
              // eslint-disable-next-line no-param-reassign
              acc += `${asset} ${free}\n`;
              return acc;
            }, '')
          }`;
          msg.channel.send(response);
          return;
        }

        const response = `Opened positions:\n${
          Object.keys(activePositions).reduce((acc, symbol) => {
            const currentOhlc = ohlc[symbol.toLowerCase()];
            const { closePrice } = currentOhlc[currentOhlc.length - 1];
            const { entry, quantity } = activePositions[symbol];
            const pnlResponse = calculatePnl(entry, closePrice);

            // eslint-disable-next-line no-param-reassign
            acc += `${removeQuote(symbol)} ${quantity} - ${pnlResponse}`;
            return acc;
          }, '')
        }`;
        msg.channel.send(response);
      },
    ]);
  }

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
