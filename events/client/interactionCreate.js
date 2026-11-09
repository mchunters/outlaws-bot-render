const { Events, MessageFlags } = require('discord.js');
const { canManageUID } = require('../../functions/outlawsConfig');
const { makeUidPage } = require('../../functions/uidPagination');
const { COMMAND_TO_FEATURE, canUseFeature } = require('../../functions/permissions');

module.exports = {
  name: Events.InteractionCreate,
  once: false,
  async execute(interaction) {
    try {
      if (interaction.isChatInputCommand()) {
        const command = interaction.client.commands.get(interaction.commandName);
        if (!command) return interaction.reply({ content: `❌ Command \`/${interaction.commandName}\` is not loaded.`, flags: MessageFlags.Ephemeral });
        const feature = COMMAND_TO_FEATURE[interaction.commandName];
        if (feature && !(await canUseFeature(interaction.member, interaction.guildId, feature))) {
          return interaction.reply({
            content: `❌ You do not have permission to use \`/${interaction.commandName}\`. Ask an admin to allow your role with \`/setup permission\`.`,
            flags: MessageFlags.Ephemeral,
          });
        }
        await command.execute(interaction);
        return;
      }
      if (interaction.isAutocomplete()) {
        const command = interaction.client.commands.get(interaction.commandName);
        if (command?.autocomplete) await command.autocomplete(interaction);
        return;
      }
      if (interaction.isButton()) {
        if (interaction.customId === 'outlaws-war-start' || interaction.customId === 'outlaws-war-end') {
          const { handleWarButton } = require('../../functions/warSystem');
          await handleWarButton(interaction);
          return;
        }
        if (interaction.customId.startsWith('outlaws-uid-page:')) {
          if (!(await canManageUID(interaction.member, interaction.guildId))) {
            return interaction.reply({ content: '❌ You do not have permission to view this UID list.', flags: MessageFlags.Ephemeral });
          }
          const page = Number(interaction.customId.split(':')[1]);
          if (!Number.isInteger(page) || page < 0) return interaction.reply({ content: 'Invalid page.', flags: MessageFlags.Ephemeral });
          const payload = await makeUidPage(interaction.guildId, page);
          await interaction.update(payload);
          return;
        }
        return;
      }
    } catch (error) {
      console.error('❌ Interaction error:', error);
      const message = { content: '❌ There was an error while executing this interaction.', flags: MessageFlags.Ephemeral };
      try {
        if (interaction.replied || interaction.deferred) await interaction.followUp(message);
        else await interaction.reply(message);
      } catch (replyError) { console.error('Could not send interaction error response:', replyError); }
    }
  },
};
