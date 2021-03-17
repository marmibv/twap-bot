const { expect } = require('chai');

const { validateWatchedAssets, validateMaxOpenedPositions, validateKeys } = require('../../src/helpers/validate-base-config');

describe('Validate config', () => {
  describe('Watched assets', () => {
    it('Should throw error \'You need to specify watchedAssets in main.config.js\'', () => {
      const watchedAssets = [];

      expect(() => validateWatchedAssets(watchedAssets))
        .to
        .throw(Error, 'You need to specify watchedAssets in main.config.js');
    });

    describe('Assets do not have all mandatory properties and those should be of right type', () => {
      it('Should throw error \'Every asset should contain symbol, timeframe and smoothing\'', () => {
        const watchedAssets = [{}];

        expect(() => validateWatchedAssets(watchedAssets))
          .to
          .throw(Error, 'Every asset should contain symbol, timeframe and smoothing');
      });

      it('Should throw error \'Every asset should contain symbol, timeframe and smoothing\'', () => {
        const watchedAssets = [{
          symbol: '',
          smoothing: 5,
        }];

        expect(() => validateWatchedAssets(watchedAssets))
          .to
          .throw(Error, 'Every asset should contain symbol, timeframe and smoothing');
      });

      it('Should throw error \'Smoothing has to be number, symbol has to be string, timeframe has to be string\'', () => {
        const watchedAssets = [{
          symbol: 0,
          smoothing: 20,
          timeframe: 5,
        }];

        expect(() => validateWatchedAssets(watchedAssets))
          .to
          .throw(Error, 'Smoothing has to be number, symbol has to be string, timeframe has to be string');
      });
    });

    describe('Symbol is not lowercase or quote is not USDT', () => {
      it('Should throw error \'Supported quote is only USDT\'', () => {
        const watchedAssets = [{
          symbol: 'sushibtc',
          smoothing: 20,
          timeframe: '1h',
        }];

        expect(() => validateWatchedAssets(watchedAssets))
          .to
          .throw(Error, 'Supported quote is only USDT');
      });

      it('Should throw error \'Symbol must be in lower case\'', () => {
        const watchedAssets = [{
          symbol: 'sushiUsdt',
          smoothing: 20,
          timeframe: '1h',
        }];

        expect(() => validateWatchedAssets(watchedAssets))
          .to
          .throw(Error, 'Symbol must be in lower case');
      });

      it('Should not throw error', () => {
        const watchedAssets = [{
          symbol: 'sushiusdt',
          smoothing: 20,
          timeframe: '1h',
        }];

        expect(() => validateWatchedAssets(watchedAssets))
          .to
          .not
          .throw();
      });
    });

    describe('Invalid timeframe', () => {
      it('Should throw error \'Ivalid timeframe\'', () => {
        const watchedAssets = [{
          symbol: 'sushiusdt',
          smoothing: 20,
          timeframe: '5h',
        }];

        expect(() => validateWatchedAssets(watchedAssets))
          .to
          .throw(Error, 'Ivalid timeframe');
      });
    });

    describe('Smoothing is lower than 2', () => {
      it('Should throw error \'Smoothing has to be higher than 2\'', () => {
        const watchedAssets = [{
          symbol: 'sushiusdt',
          smoothing: 1,
          timeframe: '4h',
        }];

        expect(() => validateWatchedAssets(watchedAssets))
          .to
          .throw(Error, 'Smoothing has to be higher than 2');
      });
    });
  });

  describe('Max positions', () => {
    it('Should throw error \'MaxOpenedPositions must be number\'', () => {
      const maxOpenedPositions = true;

      expect(() => validateMaxOpenedPositions(maxOpenedPositions))
        .to
        .throw(Error, 'MaxOpenedPositions must be number');
    });

    it('Should throw error \'MaxOpenedPositions must be higher than 0 and less than 2\'', () => {
      const maxOpenedPositions = -5;

      expect(() => validateMaxOpenedPositions(maxOpenedPositions))
        .to
        .throw(Error, 'MaxOpenedPositions must be higher than 0 and less than 2');
    });

    it('Should throw error \'MaxOpenedPositions must be higher than 0 and less than 2\'', () => {
      const maxOpenedPositions = 3;

      expect(() => validateMaxOpenedPositions(maxOpenedPositions))
        .to
        .throw(Error, 'MaxOpenedPositions must be higher than 0 and less than 2');
    });

    it('Should not throw error', () => {
      const maxOpenedPositions = 2;

      expect(() => validateMaxOpenedPositions(maxOpenedPositions))
        .to
        .not
        .throw();
    });
  });

  describe('Keys', () => {
    it('Should throw error \'Missing API key or SECRET key\'', () => {
      const keys = {
        API_KEY: '..',
      };

      expect(() => validateKeys(keys))
        .to
        .throw(Error, 'Missing API key or SECRET key');
    });

    it('Should not throw error', () => {
      const keys = {
        API_KEY: '...',
        SECRET_KEY: '...',
      };

      expect(() => validateKeys(keys))
        .to
        .not
        .throw();
    });
  });
});
