const WebSocket = require('ws');

const WSS_URL = 'wss://fstream.binance.com';
const connectToWs = (symbol, timeframe) => {
  const candlestickStream = `${symbol}@kline_${timeframe}`;

  const bnbWss = new WebSocket(`${WSS_URL}/ws/${candlestickStream}`, {
    method: 'SUBSCRIBE',
    id: 1,
  });

  bnbWss.on('open', () => {
    console.log('Connected');
  });

  return bnbWss;
};

module.exports = connectToWs;
