const {
  SlashCommandBuilder,
  PermissionFlagsBits,
} = require('discord.js');

const OutlawsConfig = require('../../models/OutlawsConfig');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('outlaws')
    .setDescription('Send a message to a selected channel')
    .addStringOption(option =>
      option
        .setName('content')
        .setDescription('Message content')
        .setRequired(true)
    )
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('Select destination channel')
        .setRequired(true)
    ),

  async execute(interaction) {
    const isAdmin = interaction.memberPermissions.has(
      PermissionFlagsBits.Administrator
    );

    const config = await OutlawsConfig.findOne({
      guildId: interaction.guild.id,
    });

    const allowedRoles =
      config?.announcementAllowedRoleIds || [];

    const hasAllowedRole = interaction.member.roles.cache.some(
      role => allowedRoles.includes(role.id)
    );

    if (!isAdmin && !hasAllowedRole) {
      return interaction.reply({
        content:
          '❌ You are not allowed to use this announcement command.',
        ephemeral: true,
      });
    }

    const content = interaction.options.getString('content');
    const channel = interaction.options.getChannel('channel');

    if (!channel.isTextBased() || !channel.send) {
      return interaction.reply({
        content: '❌ Please select a text channel.',
        ephemeral: true,
      });
    }

    try {
      await channel.send({
        content,
        allowedMentions: {
          parse: [],
        },
      });

      await interaction.reply({
        content: `✅ Message sent to ${channel}.`,
        ephemeral: true,
      });
    } catch (error) {
      console.error('Outlaws command error:', error);

      await interaction.reply({
        content: '❌ Could not send the message. Check bot permissions.',
        ephemeral: true,
      });
    }
  },
};
