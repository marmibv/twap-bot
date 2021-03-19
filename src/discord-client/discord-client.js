const Discord = require('discord.js');

const logger = require('../helpers/logger');
const chooseCommand = require('./commands');
const { discordDMChannelId, discordUserId } = require('../../main.config');

const { DISCORD_BOT_TOKEN } = process.env;

const initDiscordBot = () => {
  if (!DISCORD_BOT_TOKEN) {
    return undefined;
  }

  const client = new Discord.Client();

  client.once('ready', () => {
    logger('\nSuccessfully connected to Discord bot');
  });

  client.on('message', chooseCommand);

  client.login(DISCORD_BOT_TOKEN);

  if (
    !discordDMChannelId
    || !discordUserId
    || typeof discordDMChannelId !== 'string'
    || typeof discordUserId !== 'string'
    || !discordDMChannelId.length
    || !discordUserId.length
  ) {
    throw new Error(
      'You need to provide valid discordDMChannelId and discordUserId,'
      + 'if you do not want to receive discord messages please remove DISCORD_BOT_TOKEN env variable',
    );
  }

  const dmChannel = new Discord.DMChannel(client, {
    id: discordDMChannelId,
  });

  const sendMessage = async (message) => {
    await dmChannel.send(message);
  };

  return sendMessage;
};

const sendMessage = initDiscordBot();

module.exports = sendMessage;
