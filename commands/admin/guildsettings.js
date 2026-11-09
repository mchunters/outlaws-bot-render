const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Welcome = require('../../models/welcome');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('guildsettings')
    .setDescription('View the settings for the guild'),

  async execute(interaction) {
    const { guild } = interaction;

    const welcomeSettings = await Welcome.findOne({ serverId: guild.id });

    const embed = new EmbedBuilder()
      .setColor('#00BFFF')
      .setTitle(`Guild Settings for ${guild.name}`)
      .setTimestamp();

    embed.addFields({
      name: '**Welcome System Settings**',
      value: '\u200B',
      inline: false,
    });
    if (welcomeSettings && welcomeSettings.enabled) {
      embed.addFields(
        { name: 'Welcome System', value: 'Enabled', inline: true },
        {
          name: 'Welcome Channel',
          value: welcomeSettings.channelId
            ? `<#${welcomeSettings.channelId}>`
            : 'Not set',
          inline: true,
        }
      );
    } else {
      embed.addFields({
        name: 'Welcome System',
        value: 'Disabled',
        inline: true,
      });
    }

    return interaction.reply({ embeds: [embed] });
  },
};
