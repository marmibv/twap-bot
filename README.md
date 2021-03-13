# TWAP bot

<h3 align="center">===================</h3>
<h3 align="center">This bot was created purely for my own purposes and I am not responsible in any way for your losses caused by this bot</h3>
<h3 align="center">===================</h3>

## Setup

### Install dependencies

```bash
npm i
```

### Create .env file
- Set API_KEY and SECRET_KEY from Binance account

```.env
API_KEY=...
SECRET_KEY=...
```

### Setup base variables

#### Main.js

- initData in main.js is used when bot is running
  - default setting is btcusdt on 4h timeframe and smoothing 20

- Any timeframe that can be used on Binance can be used here too
  - 1h -> 1 hour, 1d -> 1 day, 1M -> 1 month, etc.

- it can contain any number of market pairs
  - Market pairs can not repeat
  - All market pairs must be tradable on Binance futures

- Example:

```js
const initData = [
  {
    symbol: 'btcusdt',
    timeframe: '1h',
    smoothing: 15,
  },
  {
    symbol: 'ethusdt',
    timeframe: '1h',
    smoothing: 15,
  },
  {
    symbol: 'btcusdt',  /* This will not work, even thought timeframe and smoothing is different */
    timeframe: '2h',
    smoothing: 20,
  },
];
```

#### Test.js

- capital is the initial balance, default setting is 1000
- candles represents the number of candles from which the market data is used

- initData in test.js is used when tests are running
  - default setting is btcusdt on 4h timeframe and smoothing 20

- it can contain any number of market pairs, same as in main.js
  - Market pairs can repeat, even the timeframe and smoothing can be the same
  - All market pairs must be tradable on Binance futures
  - This object also contains 'capital' property, which is required to output PnL

```js
const initData = [
  {
    symbol: 'btcusdt',
    timeframe: '1h',
    smoothing: 15,
  },
  {
    symbol: 'ethusdt',
    timeframe: '1h',
    smoothing: 15,
  },
  {
    symbol: 'btcusdt',  /* This will work fine */
    timeframe: '2h',
    smoothing: 20,
  },
  {
    symbol: 'btcusdt',  /* This will work fine too */
    timeframe: '2h',
    smoothing: 20,
  },
];
```

## Run

- Run bot

```bash
npm start
```

## Test

- Run tests based on previous market data

```bash
npm test
```
