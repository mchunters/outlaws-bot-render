const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const MirageUID = require('../../models/MirageUID');
const updateMirageUIDChannel = require('../../functions/updateMirageUIDChannel');
const { canManageUID } = require('../../functions/outlawsConfig');

module.exports = {
  data: new SlashCommandBuilder().setName('adduid').setDescription('Add or update a member Mirage City UID.')
    .addUserOption((o) => o.setName('user').setDescription('Discord member').setRequired(true))
    .addStringOption((o) => o.setName('uid').setDescription('Mirage City Game UID').setRequired(true).setMinLength(1).setMaxLength(50)),
  async execute(interaction) {
    if (!(await canManageUID(interaction.member, interaction.guildId))) return interaction.reply({ content: '❌ You do not have a configured UID manager role.', flags: MessageFlags.Ephemeral });
    const user = interaction.options.getUser('user');
    const uid = interaction.options.getString('uid').trim();
    try {
      await MirageUID.findOneAndUpdate({ guildId: interaction.guildId, discordUserId: user.id }, { guildId: interaction.guildId, discordUserId: user.id, username: user.username, gameUid: uid, addedBy: interaction.user.id }, { upsert: true, new: true, setDefaultsOnInsert: true });
      await updateMirageUIDChannel(interaction.client, interaction.guildId);
      return interaction.reply({ content: `✅ UID saved for ${user}: \`${uid}\``, flags: MessageFlags.Ephemeral });
    } catch (error) { console.error('Add UID Error:', error); return interaction.reply({ content: '❌ Failed to save the UID.', flags: MessageFlags.Ephemeral }); }
  },
};
