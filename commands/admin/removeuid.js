const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const MirageUID = require('../../models/MirageUID');
const updateMirageUIDChannel = require('../../functions/updateMirageUIDChannel');
const { canManageUID } = require('../../functions/outlawsConfig');

module.exports = {
  data: new SlashCommandBuilder().setName('removeuid').setDescription('Remove a member Mirage City UID.')
    .addUserOption((o) => o.setName('user').setDescription('Discord member').setRequired(true)),
  async execute(interaction) {
    if (!(await canManageUID(interaction.member, interaction.guildId))) return interaction.reply({ content: '❌ You do not have a configured UID manager role.', flags: MessageFlags.Ephemeral });
    const user = interaction.options.getUser('user');
    try {
      const removed = await MirageUID.findOneAndDelete({ guildId: interaction.guildId, discordUserId: user.id });
      if (!removed) return interaction.reply({ content: `❌ No UID found for ${user}.`, flags: MessageFlags.Ephemeral });
      await updateMirageUIDChannel(interaction.client, interaction.guildId);
      return interaction.reply({ content: `✅ UID removed for ${user}.`, flags: MessageFlags.Ephemeral });
    } catch (error) { console.error('Remove UID Error:', error); return interaction.reply({ content: '❌ Failed to remove the UID.', flags: MessageFlags.Ephemeral }); }
  },
};
