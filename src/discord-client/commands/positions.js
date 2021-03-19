const getUserBalances = require('../../api/get-user-balances');

const { watchedAssets } = require('../../../main.config');

const sendPositions = async (msg) => {
  const { tradedAssets } = await getUserBalances(watchedAssets);

  await msg.channel.send(tradedAssets.reduce((acc, { asset, free }) => `${acc}\n${asset} ${free}`, ''));
};

module.exports = sendPositions;
