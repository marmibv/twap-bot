const sendPositions = require('./positions');

const { discordDMChannelId, discordUserId } = require('../../../main.config');

const chooseCommand = async (msg) => {
  if (msg.author.id === discordUserId && msg.channel.id === discordDMChannelId && msg.content.startsWith('!')) {
    switch (msg.content) {
      case '!positions':
        sendPositions(msg);
        break;
      default:
        await msg.channel.send(`Unknown command: ${msg.content}`);
    }
  }
};

module.exports = chooseCommand;
