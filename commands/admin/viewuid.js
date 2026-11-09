const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const MirageUID = require('../../models/MirageUID');
const { canManageUID } = require('../../functions/outlawsConfig');
module.exports = {
  data: new SlashCommandBuilder().setName('viewuid').setDescription('View a member Mirage City UID.')
    .addUserOption((o) => o.setName('user').setDescription('Discord member').setRequired(true)),
  async execute(interaction) {
    if (!(await canManageUID(interaction.member, interaction.guildId))) return interaction.reply({ content: '❌ You do not have permission to view another member UID.', flags: MessageFlags.Ephemeral });
    const user = interaction.options.getUser('user');
    const record = await MirageUID.findOne({ guildId: interaction.guildId, discordUserId: user.id }).lean();
    if (!record) return interaction.reply({ content: `❌ No UID found for ${user}.`, flags: MessageFlags.Ephemeral });
    return interaction.reply({ content: `👤 Member: ${user}\n🎮 Game UID: \`${record.gameUid}\``, flags: MessageFlags.Ephemeral });
  },
};
