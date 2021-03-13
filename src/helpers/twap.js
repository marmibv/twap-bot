const twapPrice = (ohlc) => ohlc.reduce((total, currentOhlc) => total + currentOhlc.ohlc4, 0) / ohlc.length;

const getTwapPos = (ohlc) => {
  const currentTwapPrice = twapPrice(ohlc);
  const { closePrice } = ohlc[ohlc.length - 1];

  return currentTwapPrice > closePrice && currentTwapPrice !== closePrice ? 'above' : 'below';
};

module.exports = getTwapPos;
