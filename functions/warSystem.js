const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ChannelType, MessageFlags } = require('discord.js');
const MirageUID = require('../models/MirageUID');
const { getConfig } = require('./outlawsConfig');

const DEFAULTS = {
  panelChannelId: '1556392634593972234',
  announcementChannelId: '1547928222711152761',
  vcCategoryId: '1547829452858331216',
  startRoleIds: ['1547791040243830844','1547792026471243837','1547791289465184256','1547499535365050398','1547941486442717255'],
  endRoleIds: ['1547792026471243837','1547791289465184256','1547499535365050398','1547941486442717255'],
};
const WAR_VC_NAME = '🔴・OUTLAWS WAR';
const hasAnyRole = (member, ids) => (ids || []).some((id) => member?.roles?.cache?.has(id));
const startRow = () => new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('outlaws-war-start').setLabel('START WAR').setEmoji('🟢').setStyle(ButtonStyle.Success));
const endRow = () => new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('outlaws-war-end').setLabel('END WAR').setEmoji('🛑').setStyle(ButtonStyle.Danger));

async function getWarSettings(guildId) {
  const config = await getConfig(guildId);
  return { ...DEFAULTS, ...(config.war?.toObject?.() || config.war || {}) };
}
function panelEmbed(active, settings) {
  const start = (settings.startRoleIds || []).map((id) => `<@&${id}>`).join(', ') || 'Not configured';
  const stop = (settings.endRoleIds || []).map((id) => `<@&${id}>`).join(', ') || 'Not configured';
  return new EmbedBuilder().setTitle('⚔️ OUTLAWS WAR SYSTEM')
    .setDescription(active
      ? `**🔴 WAR STATUS: ACTIVE**\n\nThe Outlaws are currently in an active war.\n\n🔥 All members should join the War VC and follow instructions.\n\n**Allowed to end:** ${stop}`
      : `**🟢 WAR STATUS: READY**\n\nTap **🟢 START WAR** to start immediately. No form is required.\nYour registered Game UID will be added to the announcement.\n\n**Allowed to start:** ${start}\n**Allowed to end:** ${stop}`)
    .setColor(active ? 0xff0000 : 0x00ff66);
}
function findWarVoiceChannel(guild) {
  return guild.channels.cache.find((c) => c.name === WAR_VC_NAME && c.type === ChannelType.GuildVoice) || null;
}
async function findPanelMessage(channel) {
  const messages = await channel.messages.fetch({ limit: 100 });
  return messages.find((m) => m.author.id === channel.client.user.id && m.embeds.some((e) => e.title === '⚔️ OUTLAWS WAR SYSTEM')) || null;
}
async function getWarPanel(client, guildId) {
  const guild = guildId ? await client.guilds.fetch(guildId) : client.guilds.cache.first();
  if (!guild) return null;
  const settings = await getWarSettings(guild.id);
  const channel = await client.channels.fetch(settings.panelChannelId).catch(() => null);
  if (!channel?.isTextBased()) throw new Error(`War panel text channel ${settings.panelChannelId} is unavailable.`);
  const active = Boolean(findWarVoiceChannel(guild));
  const message = await findPanelMessage(channel);
  const payload = { embeds: [panelEmbed(active, settings)], components: [active ? endRow() : startRow()] };
  if (message) return message.edit(payload);
  return channel.send(payload);
}
async function setPanelState(client, active, guildId) {
  const guild = guildId ? await client.guilds.fetch(guildId) : client.guilds.cache.first();
  if (!guild) throw new Error('Outlaws server not found.');
  const settings = await getWarSettings(guild.id);
  const channel = await client.channels.fetch(settings.panelChannelId).catch(() => null);
  if (!channel?.isTextBased()) throw new Error('War panel channel is unavailable.');
  const message = await findPanelMessage(channel);
  const payload = { embeds: [panelEmbed(active, settings)], components: [active ? endRow() : startRow()] };
  return message ? message.edit(payload) : channel.send(payload);
}
async function handleWarButton(interaction) {
  if (!['outlaws-war-start', 'outlaws-war-end'].includes(interaction.customId)) return false;
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const guild = interaction.guild;
  if (!guild) { await interaction.editReply('This button can only be used inside the Outlaws server.'); return true; }
  try {
    const [member, settings] = await Promise.all([guild.members.fetch(interaction.user.id), getWarSettings(guild.id)]);
    if (interaction.customId === 'outlaws-war-start') {
      if (!hasAnyRole(member, settings.startRoleIds)) { await interaction.editReply('❌ You do not have permission to start an Outlaws war.'); return true; }
      if (findWarVoiceChannel(guild)) { await setPanelState(interaction.client, true, guild.id); await interaction.editReply('⚠️ A war is already active. Please use the existing War VC.'); return true; }
      const uid = await MirageUID.findOne({ guildId: guild.id, discordUserId: interaction.user.id }).lean();
      if (!uid?.gameUid) { await interaction.editReply('❌ You are not registered as an Outlaws member. Please create a ticket and contact the Leader or Co-Leader to get your Game UID added.'); return true; }
      const category = await guild.channels.fetch(settings.vcCategoryId).catch(() => null);
      if (!category || category.type !== ChannelType.GuildCategory) throw new Error('Configured War VC category is missing or is not a category.');
      const vc = await guild.channels.create({ name: WAR_VC_NAME, type: ChannelType.GuildVoice, parent: settings.vcCategoryId, reason: `War started by ${interaction.user.tag}` });
      try {
        const announce = await interaction.client.channels.fetch(settings.announcementChannelId).catch(() => null);
        if (!announce?.isTextBased()) throw new Error('Configured War announcement channel is unavailable.');
        await announce.send({ content: `@everyone ⚔️ **OUTLAWS WAR HAS STARTED!**\n\n👤 **Started by:** ${interaction.user}\n🎮 **Registered Game UID:** \`${uid.gameUid}\`\n🔊 **Join War VC:** ${vc}\n\n**Stay alert. Follow orders. Fight together.**`, allowedMentions: { parse: ['everyone'], users: [interaction.user.id] } });
        await setPanelState(interaction.client, true, guild.id);
      } catch (error) { await vc.delete('Rolling back incomplete war start').catch(() => {}); throw error; }
      await interaction.editReply('✅ War started. Announcement sent and War VC created.');
      return true;
    }
    if (!hasAnyRole(member, settings.endRoleIds)) { await interaction.editReply('❌ You do not have permission to end an Outlaws war.'); return true; }
    const vc = findWarVoiceChannel(guild);
    if (!vc) { await setPanelState(interaction.client, false, guild.id); await interaction.editReply('⚠️ There is no active war to end.'); return true; }
    await vc.delete(`War ended by ${interaction.user.tag}`);
    const announce = await interaction.client.channels.fetch(settings.announcementChannelId).catch(() => null);
    if (announce?.isTextBased()) await announce.send({ content: `🛑 **OUTLAWS WAR HAS ENDED!**\n\n👤 **Ended by:** ${interaction.user}\n\nStand down and wait for further orders.`, allowedMentions: { users: [interaction.user.id] } });
    await setPanelState(interaction.client, false, guild.id);
    await interaction.editReply('✅ War ended. The War VC has been removed.');
    return true;
  } catch (error) {
    console.error('Outlaws war interaction error:', error);
    await interaction.editReply('❌ War action failed. Please check the bot permissions and Render logs.').catch(() => {});
    return true;
  }
}
module.exports = { WAR_VC_NAME, hasAnyRole, getWarPanel, setPanelState, handleWarButton };
