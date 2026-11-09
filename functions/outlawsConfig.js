const OutlawsConfig = require('../models/OutlawsConfig');

async function getConfig(guildId) {
  let config = await OutlawsConfig.findOne({ guildId });
  if (!config) config = await OutlawsConfig.create({ guildId });
  return config;
}

async function canManageUID(member, guildId) {
  const config = await OutlawsConfig.findOne({ guildId }).lean();
  const roleIds = config?.uidAdminRoleIds || [];
  if (!roleIds.length) return Boolean(member?.permissions?.has('Administrator'));
  return roleIds.some((id) => member?.roles?.cache?.has(id));
}

module.exports = { getConfig, canManageUID };
