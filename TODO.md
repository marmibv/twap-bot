# DEV

- [x] init Function
  - Gets data from Binance
    - OHLC data
  - Sets up Websocket connection

- [x] Create logger

- [x] Test function
  - Test profitability based on previous data

- [x] Refactor and organize current code

- [ ] FIX Readme

# API

- Buy/Sell via Binance/FTX API

- On buy
  - [x] Check for available funds
    - If none, do nothing
    - If there are, buy asset

- On sell
  - [X] Check if there is position opened
    - If yes, close position
    - If no, do nothing

# OTHER

- [ ] Support for short positions
