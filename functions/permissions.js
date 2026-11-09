const { PermissionFlagsBits: F } = require('discord.js');
const OutlawsConfig = require('../models/OutlawsConfig');

// One entry per feature that can be given to extra roles with /setup permission.
//  commands : slash commands covered (checked centrally in events/client/interactionCreate.js)
//  fallback : Discord permission that always works too (what the command needed before)
//  field    : feature already had its own role list in OutlawsConfig (checked by the command itself)
// Administrators can always use everything (except uid, which keeps its old rule).
const FEATURES = {
  ticket:     { label: 'Ticket setup: /ticketsetup /createpanel /ticketcategory', commands: ['ticketsetup', 'createpanel', 'ticketcategory'], fallback: F.Administrator },
  welcome:    { label: 'Welcome system: /welcome /guildsettings', commands: ['welcome', 'guildsettings'], fallback: F.Administrator },
  autorole:   { label: 'Auto roles: /autorole', commands: ['autorole'], fallback: F.Administrator },
  buttonrole: { label: 'Button roles: /buttonrole', commands: ['buttonrole'], fallback: F.ManageRoles },
  giveaway:   { label: 'Giveaways: /giveaway', commands: ['giveaway'], fallback: F.Administrator },
  serverlogs: { label: 'Server logs: /serverlogs', commands: ['serverlogs'], fallback: F.Administrator },
  dm:         { label: 'Send DM: /dm', commands: ['dm'], fallback: F.Administrator },
  announce:   { label: 'Announce: /announce', commands: ['announce'], fallback: F.ManageGuild },
  embed:      { label: 'Embed builder: /embedbuilder', commands: ['embedbuilder'], fallback: F.ManageMessages },
  games:      { label: 'Games: /guessnumber /worldwar', commands: ['guessnumber', 'worldwar'], fallback: F.ManageGuild },
  ban:        { label: 'Ban: /ban /unban', commands: ['ban', 'unban'], fallback: F.BanMembers },
  kick:       { label: 'Kick: /kick', commands: ['kick'], fallback: F.KickMembers },
  timeout:    { label: 'Timeout: /timeout /untimeout', commands: ['timeout', 'untimeout'], fallback: F.ModerateMembers },
  warn:       { label: 'Warn: /warn /warnings', commands: ['warn', 'warnings'], fallback: F.KickMembers },
  clear:      { label: 'Clear messages: /clear', commands: ['clear'], fallback: F.ManageMessages },
  lock:       { label: 'Lock channel: /lock /unlock', commands: ['lock', 'unlock'], fallback: F.ManageChannels },
  nuke:       { label: 'Nuke channel: /nuke', commands: ['nuke'], fallback: F.ManageChannels },
  nick:       { label: "Change others' nicknames: /nick", commands: [], fallback: F.ManageNicknames },
  uid:        { label: 'Game UID: /adduid /removeuid /viewuid /viewalluid', commands: [], field: 'uidAdminRoleIds' },
  outlaws:    { label: 'Announcement: /outlaws', commands: [], field: 'announcementAllowedRoleIds' },
};

const COMMAND_TO_FEATURE = {};
for (const [key, feature] of Object.entries(FEATURES)) {
  for (const name of feature.commands) COMMAND_TO_FEATURE[name] = key;
}

function readRoleIds(config, key) {
  const feature = FEATURES[key];
  if (!feature || !config) return [];
  if (feature.field) return [...(config[feature.field] || [])];
  const map = config.commandRoles;
  if (!map) return [];
  return [...((map instanceof Map ? map.get(key) : map[key]) || [])];
}

function writeRoleIds(config, key, ids) {
  const feature = FEATURES[key];
  if (feature.field) config[feature.field] = ids;
  else config.commandRoles.set(key, ids);
}

async function canUseFeature(member, guildId, key) {
  const feature = FEATURES[key];
  if (!member || !feature) return false;
  if (member.permissions?.has(F.Administrator)) return true;

  const config = await OutlawsConfig.findOne({ guildId }).lean();
  const roleIds = readRoleIds(config, key);
  if (roleIds.some((id) => member.roles?.cache?.has(id))) return true;

  return feature.fallback ? Boolean(member.permissions?.has(feature.fallback)) : false;
}

module.exports = { FEATURES, COMMAND_TO_FEATURE, readRoleIds, writeRoleIds, canUseFeature };
