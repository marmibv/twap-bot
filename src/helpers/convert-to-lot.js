const convertToLot = (qty, minDecimals) => {
  const [int, decimal] = qty.toString().split('.');

  if (!decimal) {
    return int;
  }

  const lotSizeDecimal = decimal.slice(0, minDecimals);

  return Number(`${int}.${lotSizeDecimal}`);
};

module.exports = convertToLot;
