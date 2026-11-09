const mongoose = require('mongoose');

const OutlawsConfigSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true, index: true },
  uidAdminRoleIds: { type: [String], default: [] },
  announcementAllowedRoleIds: { type: [String], default: [] },
  // Roles allowed to use each feature, set with /setup permission. Key = feature name (see functions/permissions.js)
  commandRoles: { type: Map, of: [String], default: {} },
  war: {
    panelChannelId: { type: String, default: '1556392634593972234' },
    announcementChannelId: { type: String, default: '1547928222711152761' },
    vcCategoryId: { type: String, default: '1547829452858331216' },
    startRoleIds: { type: [String], default: ['1547791040243830844','1547792026471243837','1547791289465184256','1547499535365050398','1547941486442717255'] },
    endRoleIds: { type: [String], default: ['1547792026471243837','1547791289465184256','1547499535365050398','1547941486442717255'] },
  },
  leaveChannelId: { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.models.OutlawsConfig || mongoose.model('OutlawsConfig', OutlawsConfigSchema);
