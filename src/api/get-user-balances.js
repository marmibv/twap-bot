const removeQuote = require('../helpers/removeQuote');
const logger = require('../helpers/logger');

const getUserBalances = async (binance, params) => {
  const userBalances = {};

  try {
    await new Promise((resolve, reject) => {
      binance.balance((error, balances) => {
        if (error) {
          reject(error);
        }

        userBalances.availableBalance = balances.USDT.available;

        const tradedSymbols = params.map(({ symbol }) => removeQuote(symbol));
        const ownedAssets = Object.keys(balances).reduce((acc, symbol) => (
          balances[symbol].available > 0
            ? [
              ...acc,
              {
                asset: symbol,
                free: balances[symbol].available,
              },
            ]
            : acc
        ), []);
        const tradedAssets = tradedSymbols.map((symbol) => ({
          asset: symbol.toUpperCase(),
          free: balances[symbol.toUpperCase()].available,
        }));

        userBalances.ownedAssets = ownedAssets;
        userBalances.tradedAssets = tradedAssets;
        resolve();
      });
    });
  } catch (error) {
    logger(error);
  }

  return userBalances;
};

module.exports = getUserBalances;
