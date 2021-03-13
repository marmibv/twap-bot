const twapPrice = (ohlc4) => ohlc4.reduce((total, currentOHLC4) => total + currentOHLC4.avgPrice, 0) / ohlc4.length;

module.exports = twapPrice;
