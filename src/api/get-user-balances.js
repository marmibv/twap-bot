const axios = require('axios').default;
const qs = require('qs');

const encode = require('../helpers/encode');
const removeQuote = require('../helpers/removeQuote');
const logger = require('../helpers/logger');

const { API_URL } = require('../constants');

const balanceEndpoint = '/api/v3/account';

const getUserBalances = async (params) => {
  const queryString = qs.stringify({
    timestamp: Date.now(),
  });

  const sign = encode(queryString);

  let userBalances;

  try {
    const res = await axios({
      method: 'GET',
      url: `${API_URL}${balanceEndpoint}?${queryString}&signature=${sign}`,
      headers: {
        'X-MBX-APIKEY': process.env.API_KEY,
      },
    });

    const { balances } = res.data;

    const { free: availableBalance } = balances.find(({ asset }) => asset === 'USDT');

    const tradedAssetsSymbols = params.map(({ symbol }) => removeQuote(symbol));
    const ownedAssets = balances.filter(({ free }) => free > 0);
    const tradedAssets = ownedAssets.filter(({ asset }) => tradedAssetsSymbols.includes(asset));

    userBalances = {
      availableBalance,
      ownedAssets,
      tradedAssets,
    };
  } catch (error) {
    logger(error);
    throw new Error(error.response.data.msg);
  }

  return userBalances;
};

module.exports = getUserBalances;