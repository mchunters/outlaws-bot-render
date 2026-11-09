const { makeUidPage } = require('./uidPagination');

const UID_CHANNEL_ID = '1554458478649675836';
async function updateMirageUIDChannel(client, guildId) {
  try {
    const channel = await client.channels.fetch(UID_CHANNEL_ID);
    if (!channel?.isTextBased()) throw new Error('UID channel not found or is not a text channel.');
    const payload = await makeUidPage(guildId, 0);
    const messages = await channel.messages.fetch({ limit: 100 });
    let message = messages.find((m) => m.author.id === client.user.id && m.embeds.some((e) => e.title === '🏴 OUTLAWS — MIRAGE CITY UID LIST'));
    if (message) await message.edit(payload);
    else message = await channel.send(payload);
    return message;
  } catch (error) {
    console.error('UID channel update error:', error);
    return null;
  }
}
module.exports = updateMirageUIDChannel;
