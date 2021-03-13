const getOhlc = require('./helpers/get-ohlc');
const establishBnbWss = require('./helpers/wss');
const twapPrice = require('./helpers/twap-price');

require('dotenv').config();

const timeframe = '5m';
const symbol = 'sushiusdt';
const smoothing = 20;

let capital = 50;
let entry = {};

const bnbWss = establishBnbWss(symbol, timeframe);

let ohlc4 = [];
let lastPrice = 0;
let twapPosition = ''; /* above / below */

const setOhlc = async () => {
  ohlc4 = await getOhlc(symbol, timeframe, smoothing);
};

setOhlc();

const setOhlc4 = (k) => {
  const {
    o, h, l, c, T: candleCloseTime,
  } = k;

  // if candleCloseTime > last in ohlc4, pop first, push to ohlc4
  const currentOHLC4 = {
    c: Number(c),
    avgPrice: (Number(o) + Number(h) + Number(l) + Number(c)) / 4,
    candleCloseTime: new Date(candleCloseTime),
  };

  if (ohlc4[ohlc4.length - 1].candleCloseTime - candleCloseTime < 0) {
    ohlc4 = [...ohlc4.slice(1), currentOHLC4];
  }

  lastPrice = ohlc4[ohlc4.length - 1].c;
};

bnbWss.on('message', (data) => {
  const { e, k } = JSON.parse(data);

  if (e === 'kline') {
    setOhlc4(k);

    if (lastPrice > 0) {
      const prevTwapPosition = twapPosition;

      twapPosition = twapPrice(ohlc4) > lastPrice ? 'above' : 'below';

      if (prevTwapPosition === twapPosition || !prevTwapPosition.length) {
        return;
      }

      if (twapPosition === 'above') {
        // CHECK FOR OPENED POSITIONS
        // IF THERE ARE ANY, CLOSE THEM
        if (entry.type === 'long') {
          capital *= (lastPrice / entry.price);
          entry.type = 'none';

          console.log('SELL', `@$${lastPrice}`, `PnL: ${(capital / 50 - 1) * 100} - $${capital - 50}`, new Date(Date.now()));
        }
      } else if (twapPosition === 'below') {
        console.log('BUY', `@$${lastPrice}`, new Date(Date.now()));

        // SEND MARKET BUY ORDER

        entry = {
          type: 'long',
          price: lastPrice,
          amount: capital / lastPrice,
        };
      }
    }
  }
});
