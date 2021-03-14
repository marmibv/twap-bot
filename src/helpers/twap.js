const twapPrice = (ohlc) => ohlc.reduce((total, currentOhlc) => total + currentOhlc.ohlc4, 0) / ohlc.length;

const getTwapPos = (ohlc) => {
  const currentTwapPrice = twapPrice(ohlc);
  const { ohlc4 } = ohlc[ohlc.length - 1];

  return currentTwapPrice > ohlc4 && currentTwapPrice !== ohlc4 ? 'above' : 'below';
};

module.exports = getTwapPos;
