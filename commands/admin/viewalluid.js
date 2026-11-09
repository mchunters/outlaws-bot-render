const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { canManageUID } = require('../../functions/outlawsConfig');
const { makeUidPage } = require('../../functions/uidPagination');
module.exports = {
  data: new SlashCommandBuilder().setName('viewalluid').setDescription('View all registered member UIDs (33 per page).'),
  async execute(interaction) {
    if (!(await canManageUID(interaction.member, interaction.guildId))) return interaction.reply({ content: '❌ You do not have permission to view the full UID list.', flags: MessageFlags.Ephemeral });
    const payload = await makeUidPage(interaction.guildId, 0);
    return interaction.reply({ ...payload, flags: MessageFlags.Ephemeral });
  },
};
