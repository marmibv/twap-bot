const getLastPrices = (ohlc) => (
  Object.keys(ohlc).reduce((acc, symbol) => ({
    ...acc,
    [symbol.toUpperCase()]: ohlc[symbol][ohlc[symbol].length - 1].closePrice,
  }), {})
);

const getOpenedPositions = (ownedAssets, assetFilters, ohlc) => {
  const lastPrices = getLastPrices(ohlc);

  const openedPositions = ownedAssets.filter(({ asset, free }) => {
    const { minNotional } = assetFilters[`${asset}USDT`];

    return free > minNotional / lastPrices[`${asset}USDT`];
  });

  return openedPositions;
};

module.exports = {
  getLastPrices,
  getOpenedPositions,
};
