const qs = require('qs');
const Websocket = require('ws');

const fetch = require('../helpers/fetch');
const logger = require('../helpers/logger');
const encode = require('../helpers/encode');
const removeQuote = require('../helpers/removeQuote');
const convertToNumbers = require('../helpers/convert-to-numbers');
const getOpenedPositions = require('../helpers/get-opened-positions');
const floor = require('../helpers/floor');

class Binance {
  constructor({
    API_KEY, SECRET_KEY, watchedAssets, maxOpenedPositions, sendDiscordMessage,
  }) {
    this.API_KEY = API_KEY;
    this.SECRET_KEY = SECRET_KEY;
    this.watchedAssets = watchedAssets;
    this.maxOpenedPositions = maxOpenedPositions;
    this.sendDiscordMessage = sendDiscordMessage;

    this.API_URL = 'https://api.binance.com';
    this.WS_URL = 'wss://stream.binance.com:9443/stream?streams=';

    this.watchedTokensSymbols = watchedAssets.map(({ symbol }) => removeQuote(symbol));

    this.timeDiff = null;
    this.filters = null;
    this.lastUpdated = null;

    this.streams = watchedAssets.map(({ symbol, timeframe }) => `${symbol}@kline_${timeframe}`).join('/');
    this.ws = null;
  }

  async init() {
    await this.setBinanceTimeDiff();
    await this.setFilters();
    this.lastUpdated = new Date().getTime();
  }

  async updateInitBinanceData() {
    await this.init();
  }

  async setBinanceTimeDiff() {
    const timeEndpoint = '/api/v3/time';

    try {
      const { serverTime } = await fetch({
        url: `${this.API_URL}${timeEndpoint}`,
      });

      this.timeDiff = new Date().getTime() - serverTime;
    } catch (error) {
      if (error.message) {
        throw Error(error.message);
      } else if (error.msg) {
        throw Error(error.msg);
      }
    }
  }

  getTimestamp() {
    return new Date().getTime() - (this.timeDiff || 0);
  }

  async getAccountBalances(ohlc) {
    const accountEndpoint = '/api/v3/account';
    let accountBalances;

    try {
      const params = qs.stringify({
        timestamp: this.getTimestamp(),
      });
      const sign = encode(params, this.SECRET_KEY);

      const { balances } = await fetch({
        url: `${this.API_URL}${accountEndpoint}?${params}&signature=${sign}`,
        method: 'GET',
        headers: {
          'X-MBX-APIKEY': this.API_KEY,
        },
      });

      accountBalances = balances.reduce((acc, { asset, free }) => {
        if (asset === 'USDT') {
          acc.quoteBalance = free;
          return acc;
        }

        if (free > 0) {
          acc.ownedTokens.push({
            asset,
            free,
          });
        }

        if (this.watchedTokensSymbols.includes(asset)) {
          acc.tradedTokens.push({
            asset,
            free,
          });
        }

        return acc;
      }, {
        ownedTokens: [],
        tradedTokens: [],
        quoteBalance: 0,
      });
    } catch (error) {
      logger('error', error.message, 'Code:', error.code, '- USER BALANCE');
    }

    accountBalances.openedPositions = getOpenedPositions(accountBalances.tradedTokens, this.filters, ohlc);

    return accountBalances;
  }

  async setFilters() {
    const exchangeInfoEndpoint = '/api/v3/exchangeInfo';
    let assetFilters;

    try {
      const { symbols } = await fetch({
        url: `${this.API_URL}${exchangeInfoEndpoint}`,
      });

      const tradedAssetFilters = symbols
        .filter(({ baseAsset, quoteAsset }) => this.watchedTokensSymbols.includes(baseAsset) && quoteAsset === 'USDT');
      assetFilters = tradedAssetFilters.reduce((acc, { symbol, filters }) => {
        const [lotSize, minNotional] = filters.filter(({ filterType }) => filterType === 'LOT_SIZE' || filterType === 'MIN_NOTIONAL');

        acc[symbol] = {
          minNotional: Number(minNotional.minNotional),
          // Convert to number to cut off trailing zeros
          decimals: Number(lotSize.stepSize).toString().split('.')[1]?.length || 0,
        };
        return acc;
      }, {});
    } catch (error) {
      if (error.message) {
        throw Error(error.message);
      } else if (error.msg) {
        throw Error(error.msg);
      }
    }

    this.filters = assetFilters;
  }

  async fetchOhlc(limit = 500) {
    const candlesticksEndpoint = '/api/v3/klines';

    const ohlcData = await Promise.all(
      this.watchedAssets.map(({ symbol, timeframe }) => (
        fetch({
          url: `${this.API_URL}${candlesticksEndpoint}?symbol=${symbol.toUpperCase()}&interval=${timeframe}&limit=${limit}`,
        })
          .catch((err) => {
            logger('error', err.msg, 'Code:', err.code, '- OHLC');
            throw Error(err.msg);
          })
      )),
    );

    return ohlcData;
  }

  async getOhlc() {
    const { watchedAssets } = this;
    const ohlcAll = await this.fetchOhlc();

    const ohlcData = ohlcAll.reduce((acc, currentOhlc, i) => {
      const _currentOhlc = currentOhlc
        .slice(currentOhlc.length - watchedAssets[i].smoothing)
        // eslint-disable-next-line no-unused-vars
        .map(([openTime, o, h, l, c, volume, candleCloseTime]) => {
          const [open, high, low, close] = convertToNumbers([o, h, l, c]);

          return {
            closePrice: close,
            ohlc4: (open + high + low + close) / 4,
            candleCloseTime,
          };
        });

      return {
        ...acc,
        [watchedAssets[i].symbol]: _currentOhlc,
      };
    }, {});

    this.ohlc = ohlcData;
    return ohlcData;
  }

  async sendOrder(type, ohlc, currentTokenSymbol) {
    const newOrderEndpoint = '/api/v3/order';

    const { filters } = this;
    const currentFilter = filters && filters[currentTokenSymbol.toUpperCase()];

    if (!currentFilter) {
      return;
    }

    const { quoteBalance, openedPositions } = await this.getAccountBalances(ohlc);
    const currentPosition = openedPositions.find(({ asset }) => asset === removeQuote(currentTokenSymbol));

    // close price from last element tokens ohlc arr
    const { closePrice: currentPrice } = ohlc[currentTokenSymbol][ohlc[currentTokenSymbol].length - 1];

    const params = {
      symbol: currentTokenSymbol.toUpperCase(),
      side: type,
      type: 'MARKET',
    };

    const orders = {
      BUY: async () => {
        if (openedPositions.length > this.maxOpenedPositions) {
          logger('info', 'Can not buy', currentTokenSymbol.toUpperCase(), '- Max positions opened');
          return;
        }

        if (currentPosition) {
          logger('info', 'Can not buy', currentTokenSymbol.toUpperCase(), '- Position already opened');
          return;
        }

        const positionsLeftToOpen = this.maxOpenedPositions - openedPositions.length;
        if (!positionsLeftToOpen) {
          logger('info', 'Can not buy', currentTokenSymbol.toUpperCase(), '- All positions are opened');
          return;
        }

        const maxMinNotional = Math.max(...Object.values(filters).map((filter) => filter.minNotional));
        const availableBalance = quoteBalance / positionsLeftToOpen;
        if (maxMinNotional + 1 > availableBalance && positionsLeftToOpen > 1) {
          logger('info', 'Can not buy', currentTokenSymbol.toUpperCase(), '- Balance for one position is lower than largest min notional');
          return;
        }

        if (currentFilter.minNotional + 1 > availableBalance) {
          logger('info', 'Can not buy', currentTokenSymbol.toUpperCase(), '- Balance is lower than min notional -', quoteBalance);
          return;
        }

        const quantity = floor(availableBalance / currentPrice, currentFilter.decimals);

        const buyParams = qs.stringify({
          ...params,
          quantity,
          timestamp: this.getTimestamp(),
        });
        const sign = encode(buyParams, this.SECRET_KEY);

        try {
          await fetch({
            url: `${this.API_URL}${newOrderEndpoint}?${buyParams}&signature=${sign}`,
            method: 'POST',
            headers: {
              'X-MBX-APIKEY': this.API_KEY,
            },
          });

          logger('info', `Bought ${quantity} ${currentTokenSymbol.toUpperCase()} - @ $${currentPrice}`);
        } catch (error) {
          logger('error', error.msg, '- MARKET BUY');
        }

        if (this.sendDiscordMessage) {
          this.sendDiscordMessage(`Bought ${quantity} ${currentTokenSymbol.toUpperCase()} - @ $${currentPrice}`);
        }
      },
      SELL: async () => {
        if (!openedPositions.length || !currentPosition) {
          logger('info', 'Can not sell', currentTokenSymbol.toUpperCase(), '- No position opened');
          return;
        }

        const { free } = currentPosition;
        const quantity = floor(free, currentFilter.decimals);

        const sellParams = qs.stringify({
          ...params,
          quantity,
          timestamp: this.getTimestamp(),
        });
        const sign = encode(sellParams, this.SECRET_KEY);

        try {
          await fetch({
            url: `${this.API_URL}${newOrderEndpoint}?${sellParams}&signature=${sign}`,
            method: 'POST',
            headers: {
              'X-MBX-APIKEY': this.API_KEY,
            },
          });

          logger('info', `Sold ${quantity} ${currentTokenSymbol.toUpperCase()} - @ $${currentPrice}`);
        } catch (error) {
          logger('error', error.msg, '- MARKET SELL');
        }

        if (this.sendDiscordMessage) {
          this.sendDiscordMessage(`Sold ${quantity} ${currentTokenSymbol.toUpperCase()} - @ $${currentPrice}`);
        }
      },
    };

    orders[type]();
  }

  watchCandlesticks(onMessageCallback) {
    this.ws = new Websocket(`${this.WS_URL}${this.streams}`, {
      method: 'SUBSCRIBE',
      id: 1,
    });

    this.ws.on('open', () => {
      logger('info', '\nListening to streams:', this.streams.split('/').join(', '));
    });

    this.ws.on('message', async (data) => {
      if (new Date().getTime() - this.lastUpdated > 1000 * 60 * 60 * 12) {
        await this.updateInitBinanceData();
      }

      if (typeof onMessageCallback === 'function') {
        onMessageCallback(data);
      }
    });

    this.ws.on('close', () => {
      this.initWs(onMessageCallback);
    });
  }
}

module.exports = Binance;
