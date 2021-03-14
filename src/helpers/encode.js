const crypto = require('crypto');

const encode = (totalParams, key) => crypto
  .createHmac('sha256', `${key || process.env.SECRET_KEY}`)
  .update(totalParams)
  .digest('hex');

module.exports = encode;
