const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const MirageUID = require('../models/MirageUID');

async function makeUidPage(guildId, page = 0) {
  const pageSize = 33;
  const total = await MirageUID.countDocuments({ guildId });
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(0, page), pages - 1);
  const rows = await MirageUID.find({ guildId }).sort({ username: 1 }).skip(safePage * pageSize).limit(pageSize).lean();
  const embed = new EmbedBuilder().setColor(0x8e44ad).setTitle('🏴 OUTLAWS — MIRAGE CITY UID LIST')
    .setDescription(rows.length ? rows.map((u, i) => `**${safePage * pageSize + i + 1}. ${u.username}**\n👤 <@${u.discordUserId}>  •  🎮 \`${u.gameUid}\``).join('\n\n') : '📭 No UID records found.')
    .setFooter({ text: `Total Members: ${total} • Page ${safePage + 1}/${pages}` }).setTimestamp();
  const components = pages > 1 ? [new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`outlaws-uid-page:${safePage - 1}`).setLabel('Previous').setStyle(ButtonStyle.Secondary).setDisabled(safePage === 0),
    new ButtonBuilder().setCustomId(`outlaws-uid-page:${safePage + 1}`).setLabel('Next').setStyle(ButtonStyle.Secondary).setDisabled(safePage >= pages - 1),
  )] : [];
  return { embeds: [embed], components };
}
module.exports = { makeUidPage };
