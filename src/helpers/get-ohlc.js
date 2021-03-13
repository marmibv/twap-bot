const convertToNumbers = require('./convert-to-numbers');

const getOhlc = (
  ohlcArr,
  {
    o, h, l, c, T: candleCloseTime,
  },
) => {
  const { candleCloseTime: latestCandleCloseTime } = ohlcArr[ohlcArr.length - 1];

  if (latestCandleCloseTime === candleCloseTime) {
    return {
      ohlc: ohlcArr,
      newCandle: false,
    };
  }

  const [open, high, low, close] = convertToNumbers([o, h, l, c]);

  const currentOhlc = {
    candleCloseTime,
    closePrice: close,
    ohlc4: (open + high + low + close) / 4,
  };

  return {
    ohlc: [...ohlcArr.slice(1), currentOhlc],
    newCandle: true,
  };
};

module.exports = getOhlc;
