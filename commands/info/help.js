const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} = require('discord.js');
const Fuse = require('fuse.js');

const PAGE_SIZE = 8;
const MENU_TIMEOUT_MS = 5 * 60 * 1000;

const CATEGORY_MAP = {
  admin: { name: 'Administration', emoji: '⚙️' },
  fun: { name: 'Fun & Games', emoji: '🎉' },
  moderation: { name: 'Moderation', emoji: '🔨' },
  utility: { name: 'Utility', emoji: '🪛' },
  info: { name: 'Information', emoji: 'ℹ️' },
  tickets: { name: 'Tickets', emoji: '🎫' },
};

function buildCategories(client) {
  const categories = {};
  client.commands.forEach((cmd) => {
    const raw = cmd.category || 'Uncategorized';
    const display = CATEGORY_MAP[raw] || { name: raw, emoji: '📁' };
    const key = `${display.emoji} ${display.name}`;
    if (!categories[key]) categories[key] = [];
    categories[key].push(cmd.data.name);
  });
  // Sort commands inside each category
  for (const key of Object.keys(categories)) {
    categories[key].sort((a, b) => a.localeCompare(b));
  }
  return categories;
}

function createMainEmbed(client, user) {
  const botName = client.user?.username || 'Outlaws';
  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setThumbnail(client.user.displayAvatarURL({ size: 1024 }))
    .setTitle(`📖 ${botName} Help Menu`)
    .setDescription(
      'Server setup, tickets, moderation, fun commands — everything in one place.\nUse the **dropdown** below to browse by category.'
    )
    .addFields(
      {
        name: '🚀 Getting Started',
        value: [
          '**1.** Run `/setup` to configure permissions & systems',
          '**2.** Run `/ticketsetup` to enable the ticket system',
          '**3.** Use the menu below to explore all commands',
        ].join('\n'),
        inline: false,
      },
      {
        name: 'ℹ️ Quick Tips',
        value: [
          '• `/help <command>` — detailed info for one command',
          '• `/help search:<keyword>` — fuzzy search commands',
          '• Select a category from the menu to list its commands',
        ].join('\n'),
        inline: false,
      }
    )
    .setFooter({
      text: `Requested by ${user.tag} • Menu closes after 5 minutes`,
      iconURL: user.displayAvatarURL(),
    })
    .setTimestamp();
}

function createCategoryEmbed(client, user, categoryKey, commands, page) {
  const totalPages = Math.max(1, Math.ceil(commands.length / PAGE_SIZE));
  const pageNum = Math.min(Math.max(0, page), totalPages - 1);
  const slice = commands.slice(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE);

  const description =
    slice
      .map((name) => {
        const cmd = client.commands.get(name);
        const desc = cmd?.data?.description || 'No description';
        return `> \`/${name}\` — ${desc}`;
      })
      .join('\n') || 'No commands in this category.';

  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(`${categoryKey}`)
    .setDescription(description)
    .setFooter({
      text: `Page ${pageNum + 1}/${totalPages} • ${commands.length} commands • ${user.tag}`,
      iconURL: user.displayAvatarURL(),
    })
    .setTimestamp();
}

function createSelectMenu(categories, selectedValue) {
  const options = [
    {
      label: '📋 Main Menu',
      description: 'Back to the main help overview',
      value: 'help-main',
      default: selectedValue === 'help-main',
    },
    ...Object.keys(categories).map((key) => ({
      label: key.slice(0, 100),
      description: `${categories[key].length} command(s)`,
      value: key,
      default: selectedValue === key,
    })),
  ];

  return new StringSelectMenuBuilder()
    .setCustomId('help-menu')
    .setPlaceholder('Select a category to view commands')
    .addOptions(options.slice(0, 25)); // Discord max 25 options
}

function createPaginationRow(page, totalPages) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('help-prev')
      .setLabel('Previous')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page <= 0),
    new ButtonBuilder()
      .setCustomId('help-next')
      .setLabel('Next')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page + 1 >= totalPages),
    new ButtonBuilder()
      .setCustomId('help-home')
      .setLabel('Main Menu')
      .setStyle(ButtonStyle.Primary)
  );
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Interactive help menu with all bot commands')
    .addStringOption((option) =>
      option
        .setName('command')
        .setDescription('Get detailed info about a specific command')
        .setAutocomplete(true)
    )
    .addStringOption((option) =>
      option
        .setName('search')
        .setDescription('Search for commands using keywords')
    ),

  async autocomplete(interaction) {
    const focused = interaction.options.getFocused().trim().toLowerCase();
    const names = [...interaction.client.commands.keys()];
    const filtered = names
      .filter((n) => n.toLowerCase().startsWith(focused) || n.toLowerCase().includes(focused))
      .slice(0, 25)
      .map((name) => ({ name, value: name }));
    await interaction.respond(filtered);
  },

  async execute(interaction) {
    const { client, user } = interaction;
    const commandName = interaction.options.getString('command');
    const searchQuery = interaction.options.getString('search');

    // --- Search ---
    if (searchQuery) {
      const fuse = new Fuse([...client.commands.values()], {
        keys: ['data.name', 'data.description'],
        threshold: 0.4,
      });
      const results = fuse.search(searchQuery);
      if (!results.length) {
        return interaction.reply({
          content: `❌ No commands found matching **"${searchQuery}"**.`,
          ephemeral: true,
        });
      }
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle(`🔎 Search Results for "${searchQuery}"`)
        .setDescription(
          results
            .slice(0, 15)
            .map(
              (r, i) =>
                `**${i + 1}.** \`/${r.item.data.name}\` — ${r.item.data.description || 'No description'}`
            )
            .join('\n')
        )
        .setFooter({ text: `Requested by ${user.tag}`, iconURL: user.displayAvatarURL() })
        .setTimestamp();
      return interaction.reply({ embeds: [embed] });
    }

    // --- Single command details ---
    if (commandName) {
      const command = client.commands.get(commandName);
      if (!command) {
        return interaction.reply({ content: '❌ Command not found!', ephemeral: true });
      }
      const opts = command.data.options || [];
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle(`🔍 /${command.data.name}`)
        .setDescription(command.data.description || 'No description available.')
        .addFields(
          {
            name: 'Usage',
            value:
              `\`/${command.data.name}\`` +
              (opts.length
                ? ' ' + opts.map((o) => (o.required ? `<${o.name}>` : `[${o.name}]`)).join(' ')
                : ''),
          },
          ...(opts.length
            ? [
                {
                  name: 'Options',
                  value: opts
                    .map(
                      (o) =>
                        `• \`${o.name}\`${o.required ? ' (required)' : ''} — ${o.description || 'No description'}`
                    )
                    .join('\n'),
                },
              ]
            : [])
        )
        .setFooter({ text: `Requested by ${user.tag}`, iconURL: user.displayAvatarURL() })
        .setTimestamp();
      return interaction.reply({ embeds: [embed] });
    }

    // --- Interactive main menu (Titan-style) ---
    const categories = buildCategories(client);
    let currentKey = 'help-main';
    let page = 0;

    const selectRow = new ActionRowBuilder().addComponents(
      createSelectMenu(categories, currentKey)
    );

    const message = await interaction.reply({
      embeds: [createMainEmbed(client, user)],
      components: [selectRow],
      fetchReply: true,
    });

    const collector = message.createMessageComponentCollector({
      time: MENU_TIMEOUT_MS,
      filter: (i) => i.user.id === user.id,
    });

    collector.on('collect', async (i) => {
      try {
        if (i.isStringSelectMenu() && i.customId === 'help-menu') {
          currentKey = i.values[0];
          page = 0;

          if (currentKey === 'help-main') {
            await i.update({
              embeds: [createMainEmbed(client, user)],
              components: [
                new ActionRowBuilder().addComponents(createSelectMenu(categories, currentKey)),
              ],
            });
            return;
          }

          const cmds = categories[currentKey] || [];
          const totalPages = Math.max(1, Math.ceil(cmds.length / PAGE_SIZE));
          await i.update({
            embeds: [createCategoryEmbed(client, user, currentKey, cmds, page)],
            components: [
              new ActionRowBuilder().addComponents(createSelectMenu(categories, currentKey)),
              createPaginationRow(page, totalPages),
            ],
          });
          return;
        }

        if (i.isButton()) {
          if (i.customId === 'help-home') {
            currentKey = 'help-main';
            page = 0;
            await i.update({
              embeds: [createMainEmbed(client, user)],
              components: [
                new ActionRowBuilder().addComponents(createSelectMenu(categories, currentKey)),
              ],
            });
            return;
          }

          const cmds = categories[currentKey] || [];
          const totalPages = Math.max(1, Math.ceil(cmds.length / PAGE_SIZE));

          if (i.customId === 'help-prev' && page > 0) page--;
          if (i.customId === 'help-next' && page + 1 < totalPages) page++;

          await i.update({
            embeds: [createCategoryEmbed(client, user, currentKey, cmds, page)],
            components: [
              new ActionRowBuilder().addComponents(createSelectMenu(categories, currentKey)),
              createPaginationRow(page, totalPages),
            ],
          });
        }
      } catch (err) {
        console.error('Help menu interaction error:', err);
      }
    });

    collector.on('end', async () => {
      try {
        const closed = new EmbedBuilder()
          .setColor(0x99aab5)
          .setTitle('Help menu closed')
          .setDescription('This help menu has expired. Run `/help` again to reopen it.');
        await interaction.editReply({ embeds: [closed], components: [] });
      } catch (_) {
        // interaction may already be expired
      }
    });
  },
};
