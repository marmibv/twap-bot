const Discord = require('discord.js');

const logger = require('../helpers/logger');

const initDiscordBot = ({ DISCORD_BOT_TOKEN, discordDMChannelId, discordUserId }) => {
  if (!DISCORD_BOT_TOKEN) {
    logger('info', '\nDiscord bot could not connect. missing DISCORD_BOT_TOKEN');
    return {};
  }

  const client = new Discord.Client();

  client.once('ready', () => {
    logger('info', '\nSuccessfully connected to Discord bot');
  });

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

  const setCommandsResponses = (commands) => {
    client.on('message', (msg) => {
      if (
        msg.author.id === discordUserId
        && msg.channel.id === discordDMChannelId
        && msg.content.startsWith('!')
        && typeof commands[msg.content.slice(1)] === 'function'
      ) {
        commands[msg.content.slice(1)](msg);
      }
    });
  };

  const dmChannel = new Discord.DMChannel(client, {
    id: discordDMChannelId,
  });

  const sendDiscordMessage = async (message) => {
    await dmChannel.send(message);
  };

  return {
    setCommandsResponses,
    sendDiscordMessage,
  };
};

module.exports = initDiscordBot;
