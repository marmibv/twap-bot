const axios = require('axios');

const removeQuote = require('../helpers/removeQuote');
const logger = require('../helpers/logger');

const { API_URL } = require('../constants');

const exchangeInfoEndpoint = '/api/v3/exchangeInfo';

const getAssetFilters = async (initData) => {
  const symbols = initData.map(({ symbol }) => removeQuote(symbol));

  const assetFilters = {};

  try {
    const res = await axios({
      method: 'GET',
      url: `${API_URL}${exchangeInfoEndpoint}`,
    });

    const { symbols: markets } = res.data;

    const tradedAssets = markets.filter(({ baseAsset, quoteAsset }) => symbols.includes(baseAsset) && quoteAsset === 'USDT');

    tradedAssets.forEach(({ symbol, filters }) => {
      const [lotSize, minNotional] = filters.filter(({ filterType }) => filterType === 'LOT_SIZE' || filterType === 'MIN_NOTIONAL');
      assetFilters[symbol] = {
        minNotional: Number(minNotional.minNotional),
        decimals: Number(lotSize.stepSize).toString().split('.').reverse()[0].length,
      };
    });
  } catch (error) {
    logger(error);
    throw new Error(error.response.data.msg);
  }

  return assetFilters;
};

module.exports = getAssetFilters;
