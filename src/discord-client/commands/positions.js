const getUserBalances = require('../../api/get-user-balances');

const { watchedAssets } = require('../../../main.config');

const sendPositions = async (msg) => {
  const { tradedAssets } = await getUserBalances(watchedAssets);

  await msg.channel.send(
    tradedAssets.length
      ? `You have ${tradedAssets.length} opened position${tradedAssets.length > 1 ? 's' : ''}: \n${
        tradedAssets.reduce((acc, { asset, free }) => `${acc}\n${asset} ${free}`, '')
      }`
      : 'You don\'t have any opened positions',
  );
};

module.exports = sendPositions;
