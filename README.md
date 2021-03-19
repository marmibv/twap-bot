# TWAP bot

<h3 align="center">===================</h3>
<h3 align="center">This bot was created purely for my own purposes and I am not responsible in any way for your losses caused by this bot</h3>
<h3 align="center">===================</h3>

## Setup

### Install dependencies

```sh
npm i
```

### Create .env file
- Set API_KEY and SECRET_KEY from Binance account

```.env
API_KEY=...
SECRET_KEY=...
DISCORD_BOT_TOKEN=...
```

### Setup base config for bot

- Data from main.config.js is used when bot is running

#### Watched assets

- Any assets that bot should be watching must be in watchedAssets
  - Every asset object contains
    - symbol
      - Market pair tradable on Binance, must be in lower case
      - Right now only supported quote is USDT
      - Symbols can not repeat
    - timeframe
      - Any timeframe supported on Binance
      - Supported format: 1h -> 1 hour, 1d -> 1 day, 1M -> 1 month, etc.
    - smoothing
      - Twap smoothing

- Default config is btcusdt on 4h timeframe and smoothing 20

- Example of what watchedAssets should look like

```js
// main.config.js

module.exports = {
  watchedAssets: [
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
  ],
};
```

#### Max opened positions

- Maximum opened positions at once
  - can not be 0
  - must be equal or lower than 2
    - Support for more should be added soon

```js
// main.config.js

module.exports = {
  // ...
  maxOpenedPositions: 2,
};
```

#### logOutput

- Set to true in order to see output in console
  - is not mandatory in order for bot to function properly

- This can also be set as environment variable LOG_OUTPUT

```js
// main.config.js

module.exports = {
  // ...
  logOutput: true,
};
```

### Discord messages

- If you want to get Discord messages when bot executes buy or sell and access to some commands also set these variables

#### DISCORD_BOT_TOKEN

- Bot token from your own discord bot

```.env
...
DISCORD_BOT_TOKEN=...
```

#### Discord DM channel ID

- Discord direct message channel id with your bot

```js
// main.config.js

module.exports = {
  // ...
  discordDMChannelId: '...',
};
```

#### Discord user ID

- Your discord user id

```js
// main.config.js

module.exports = {
  // ...
  discordUserId: '...',
};
```

### Setup base config for tests

- capital is the initial balance, default setting is 1000
- candles represents the number of candles from which the market data is used + 1

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

## Start bot

```sh
npm start
```

## Test

- Run tests based on previous market data

```sh
npm test
```
