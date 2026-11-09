OUTLAWS BOT V2 — SETUP PATCH
============================

IMPORTANT
---------
This is an UPDATE PATCH (changed/new files), not a complete copy of your repository.
It is based on the source files that were readable from your GitHub repository.
Do not delete your existing project. Merge these folders into the root of your current repo and choose REPLACE when asked for matching files.

WHAT IT ADDS
------------
1. /setup uid — choose up to five roles allowed to add/remove/manage UIDs.
2. /setup war — choose War panel channel, announcement channel, War VC category, start roles and stop roles.
3. /setup leave — choose the member-leave notification channel.
4. /setup status — show saved configuration.
5. /myuid — each member can privately view only their own saved Game UID.
6. /viewalluid — UID managers can browse all UIDs, 33 members per page.
7. /adduid and /removeuid — now use the UID manager roles configured with /setup uid. If no UID roles have been configured, Administrator permission is used as a fallback.
8. War panel reads saved channel/role settings from MongoDB. War starts immediately, requires the starter to have a saved UID, includes that UID in the announcement, creates the VC under the configured category, and shows the Stop button while active.
9. Leave notification shows the member name and Game UID, or “UID: Not Registered”.
10. Existing command/event folder loaders already load the added files automatically; slash commands still need deployment.

INSTALL
-------
1. Download your existing repository ZIP from GitHub and extract it on your phone/PC, or open the repo in your editor.
2. Extract this patch ZIP.
3. Copy the patch's models/, functions/, commands/, and events/ folders into your repository root.
4. Replace files when prompted. Do not replace package.json or lanya.js.
5. Commit/push the merged project to GitHub and let Render redeploy.
6. Run your existing slash-command deployment process (the project’s deployCommands handler/script). This is necessary for /setup and /myuid to appear.
7. In Discord, run /setup uid, /setup war, and /setup leave as a server Administrator.

REQUIRED BOT PERMISSIONS
------------------------
Manage Channels (create/delete the War VC), View Channel, Send Messages, Embed Links, Read Message History, and Use Application Commands.
The bot must have permission to mention @everyone in the configured announcement channel if you want the war alert to ping everyone.

DATABASE
--------
No new npm package is required. The patch uses the existing Mongoose dependency and MongoDB connection.

NOTES / CHECK BEFORE DEPLOY
---------------------------
- Ensure the configured UID manager roles are assigned to the correct people.
- Ensure the bot role is above roles it needs to manage and has access to the selected channels/category.
- The existing fixed UID channel ID remains 1554458478649675836 for the automatic 33-per-page UID list.
- If the repo already has a /setup command, resolve the duplicate command name before deploying.
- Run `node --check` on the changed JavaScript files before deployment.
