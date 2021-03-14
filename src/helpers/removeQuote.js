const removeQuote = (marketPair) => marketPair.toUpperCase().replace('USDT', '');

module.exports = removeQuote;
