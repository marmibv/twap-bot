const floor = (qty, minDecimals) => {
  const [int, decimal] = qty.toString().split('.');

  if (!decimal && minDecimals === 0) {
    return int;
  }

  const lotSizeDecimal = decimal.slice(0, minDecimals);

  return Number(`${int}.${lotSizeDecimal}`);
};

module.exports = floor;
