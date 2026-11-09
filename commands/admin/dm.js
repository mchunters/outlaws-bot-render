const {
  SlashCommandBuilder,
  PermissionFlagsBits,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dm')
    .setDescription('Send a direct message to a Discord user')
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('Select the user who will receive the DM')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('message')
        .setDescription('Message to send')
        .setRequired(true)
        .setMaxLength(2000)
    ),

  async execute(interaction) {

    const user = interaction.options.getUser('user');
    const message = interaction.options.getString('message', true);

    try {
      await user.send(message);

      return interaction.reply({
        content: `✅ DM sent successfully to **${user.tag}**.`,
        ephemeral: true,
      });
    } catch (error) {
      console.error('DM send error:', error);

      return interaction.reply({
        content:
          `❌ Could not send a DM to **${user.tag}**. ` +
          `The user may have disabled DMs or blocked the bot.`,
        ephemeral: true,
      });
    }
  },
};
