const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { getConfig } = require('../../functions/outlawsConfig');
const { FEATURES, readRoleIds, writeRoleIds } = require('../../functions/permissions');

const featureChoices = Object.entries(FEATURES).map(([value, f]) => ({
  name: f.label.slice(0, 100),
  value,
}));

const addFeatureOption = (sub, required) =>
  sub.addStringOption((o) =>
    o
      .setName('feature')
      .setDescription('Which feature')
      .setRequired(required)
      .addChoices(...featureChoices)
  );

const addRoleOption = (sub) =>
  sub.addRoleOption((o) => o.setName('role').setDescription('Select role').setRequired(true));

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Configure Outlaws bot systems')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

    .addSubcommandGroup((group) =>
      group
        .setName('permission')
        .setDescription('Choose which roles can use which commands')
        .addSubcommand((sub) =>
          addRoleOption(addFeatureOption(sub.setName('add').setDescription('Allow a role to use a feature'), true))
        )
        .addSubcommand((sub) =>
          addRoleOption(addFeatureOption(sub.setName('remove').setDescription('Remove a role from a feature'), true))
        )
        .addSubcommand((sub) =>
          addFeatureOption(sub.setName('list').setDescription('Show allowed roles'), false)
        )
    )

    .addSubcommandGroup((group) =>
      group
        .setName('announcement')
        .setDescription('Announcement command permissions')
        .addSubcommand((sub) =>
          sub
            .setName('add')
            .setDescription('Allow a role to use /outlaws')
            .addRoleOption((o) => o.setName('role').setDescription('Select allowed role').setRequired(true))
        )
        .addSubcommand((sub) =>
          sub
            .setName('remove')
            .setDescription('Remove announcement permission')
            .addRoleOption((o) => o.setName('role').setDescription('Select role').setRequired(true))
        )
        .addSubcommand((sub) => sub.setName('list').setDescription('View allowed announcement roles'))
    ),

  async execute(interaction) {
    const ephemeral = MessageFlags.Ephemeral;
    const noPing = { parse: [] };

    if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ Only administrators can use this setup.', flags: ephemeral });
    }

    const group = interaction.options.getSubcommandGroup();
    const action = interaction.options.getSubcommand();
    const config = await getConfig(interaction.guild.id);

    // /setup announcement ... is the same as /setup permission ... feature:outlaws
    const key = group === 'announcement' ? 'outlaws' : interaction.options.getString('feature');

    if (action === 'list') {
      if (key) {
        const ids = readRoleIds(config, key);
        return interaction.reply({
          content: ids.length
            ? `**${FEATURES[key].label}**\n${ids.map((id) => `<@&${id}>`).join('\n')}`
            : `**${FEATURES[key].label}**\nNo roles added. Only people with the default Discord permission (and Administrators) can use it.`,
          allowedMentions: noPing,
          flags: ephemeral,
        });
      }
      const lines = Object.entries(FEATURES)
        .map(([k, f]) => [f.label, readRoleIds(config, k)])
        .filter(([, ids]) => ids.length)
        .map(([label, ids]) => `**${label}**\n${ids.map((id) => `<@&${id}>`).join(' ')}`);
      return interaction.reply({
        content: lines.length ? lines.join('\n\n') : 'No roles added yet. Use `/setup permission add`.',
        allowedMentions: noPing,
        flags: ephemeral,
      });
    }

    const role = interaction.options.getRole('role', true);
    const ids = readRoleIds(config, key);

    if (action === 'add') {
      if (ids.includes(role.id)) {
        return interaction.reply({ content: `⚠️ ${role} can already use this.`, allowedMentions: noPing, flags: ephemeral });
      }
      writeRoleIds(config, key, [...ids, role.id]);
      await config.save();
      return interaction.reply({
        content: `✅ ${role} can now use **${FEATURES[key].label}**.`,
        allowedMentions: noPing,
        flags: ephemeral,
      });
    }

    if (action === 'remove') {
      writeRoleIds(config, key, ids.filter((id) => id !== role.id));
      await config.save();
      return interaction.reply({
        content: `✅ ${role} removed from **${FEATURES[key].label}**.`,
        allowedMentions: noPing,
        flags: ephemeral,
      });
    }
  },
};
