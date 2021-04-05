const Discord = require('discord.js');

const logger = require('../helpers/logger');

const validateDiscordIds = (dmChannelId, userId) => {
  if (
    !dmChannelId
    || !userId
    || typeof dmChannelId !== 'string'
    || typeof userId !== 'string'
    || !dmChannelId.length
    || !userId.length
  ) {
    throw new Error(
      'You need to provide valid discordDMChannelId and discordUserId,'
      + 'if you do not want to receive discord messages please remove DISCORD_BOT_TOKEN env variable',
    );
  }
};

const initDiscordBot = ({ DISCORD_BOT_TOKEN, discordDMChannelId, discordUserId }) => {
  if (!DISCORD_BOT_TOKEN) {
    logger('info', '\nDiscord bot could not connect. missing DISCORD_BOT_TOKEN');
    return {};
  }
  validateDiscordIds(discordDMChannelId, discordUserId);

  const client = new Discord.Client();

  client.once('ready', () => {
    logger('info', '\nSuccessfully connected to Discord bot');
  });

  client.login(DISCORD_BOT_TOKEN);

  const responseMessages = {};

  const setResponseMessage = ([key, command]) => {
    responseMessages[key] = command;
  };

  const dmChannel = new Discord.DMChannel(client, {
    id: discordDMChannelId,
  });

  const sendDiscordMessage = async (message) => {
    await dmChannel.send(message);
  };

  client.on('message', async (msg) => {
    if (msg.author.id === discordUserId && msg.channel.id === discordDMChannelId && msg.content.startsWith('!')) {
      const response = responseMessages[msg.content];

      if (typeof response !== 'function') {
        msg.channel.send(`Command: '${msg.content}' not found! :no_entry_sign:`);
        return;
      }

      response(msg);
    }
  });

  return {
    sendDiscordMessage,
    setResponseMessage,
  };
};

module.exports = initDiscordBot;
