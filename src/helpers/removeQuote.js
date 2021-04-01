const removeQuote = (marketPair, quote = 'USDT') => marketPair.toUpperCase().replace(quote, '');

module.exports = removeQuote;
