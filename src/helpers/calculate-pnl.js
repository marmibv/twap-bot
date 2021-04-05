const calculatePnl = (entry, currentPrice) => {
  const pnl = (currentPrice / entry - 1) * 100;

  return `PnL: ${pnl ? `Pnl: ${pnl.toFixed(2)}% ${pnl > 0 ? ':money_mouth:' : '📉'}` : ''}`;
};

module.exports = calculatePnl;
