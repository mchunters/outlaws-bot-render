const { Events, EmbedBuilder } = require('discord.js');
const ServerLog = require('../../models/serverlogs');
const MirageUID = require('../../models/MirageUID');
const OutlawsConfig = require('../../models/OutlawsConfig');

module.exports = {
  name: Events.GuildMemberRemove,
  once: false,
  async execute(member) {
    try {
      const [config, uid] = await Promise.all([
        OutlawsConfig.findOne({ guildId: member.guild.id }).lean(),
        MirageUID.findOne({ guildId: member.guild.id, discordUserId: member.id }).lean(),
      ]);
      let channel = config?.leaveChannelId
        ? member.guild.channels.cache.get(config.leaveChannelId)
        : null;
      if (!channel) {
        const settings = await ServerLog.findOne({ guildId: member.guild.id });
        if (settings?.logChannel && settings?.categories?.memberEvents) {
          channel = member.guild.channels.cache.get(settings.logChannel);
        }
      }
      if (!channel?.isTextBased()) return;
      const embed = new EmbedBuilder()
        .setColor(0xff3333)
        .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL() })
        .setTitle('Member Left')
        .setDescription(`<@${member.id}> has left the server.`)
        .addFields({ name: 'Discord Name', value: member.user.tag, inline: true }, { name: 'Game UID', value: uid?.gameUid ? `\`${uid.gameUid}\`` : 'UID: Not Registered', inline: true })
        .setTimestamp();
      await channel.send({ embeds: [embed] });
    } catch (error) {
      console.error('Member leave notification error:', error);
    }
  },
};
