const getLastPrices = (ohlc) => (
  Object.keys(ohlc).reduce((acc, symbol) => ({
    ...acc,
    [symbol.toUpperCase()]: ohlc[symbol][ohlc[symbol].length - 1].closePrice,
  }), {})
);

const getOpenedPositions = (tradedAssets, assetFilters, ohlc) => {
  const lastPrices = getLastPrices(ohlc);

  const openedPositions = tradedAssets.filter(({ asset, free }) => {
    const { minNotional } = assetFilters[`${asset}USDT`];
    return free > minNotional / lastPrices[`${asset}USDT`];
  });

  return openedPositions;
};

module.exports = getOpenedPositions;
