const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const MirageUID = require('../../models/MirageUID');
module.exports = {
  data: new SlashCommandBuilder().setName('myuid').setDescription('View your own registered Mirage City UID.'),
  async execute(interaction) {
    const record = await MirageUID.findOne({ guildId: interaction.guildId, discordUserId: interaction.user.id }).lean();
    if (!record?.gameUid) return interaction.reply({ content: '❌ No UID is registered for you yet. Please create a ticket and contact the Leader or Co-Leader.', flags: MessageFlags.Ephemeral });
    return interaction.reply({ content: `🎮 **Your Mirage City UID:** \`${record.gameUid}\``, flags: MessageFlags.Ephemeral });
  },
};
