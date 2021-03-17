const { expect } = require('chai');

const floor = require('../../src/helpers/floor');

describe('floor', () => {
  it('Should floor 1.58964 to 1', () => {
    expect(floor(1.58964, 0)).to.equal(1);
  });
});
