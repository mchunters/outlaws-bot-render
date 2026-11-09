const express = require('express');
const app = express();

require('dotenv').config();

const {
  Client,
  GatewayIntentBits,
  Partials,
} = require('discord.js');


const fs = require('fs');
const path = require('path');
const chalk = require('chalk');


// ==========================================
// 🌐 RENDER WEB SERVER
// ==========================================

const PORT = process.env.PORT || 10000;

app.get('/', (req, res) => {
  res.status(200).send('Everything is up!');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Express server running on port ${PORT}`);
});

// ==========================================
// 🔐 ENV CHECK
// ==========================================

const requiredEnv = [
  'DISCORD_TOKEN',
  'DISCORD_CLIENT_ID',
];

const missingEnv = requiredEnv.filter(
  (name) => !process.env[name]
);

if (missingEnv.length > 0) {
  console.error(
    `❌ Missing environment variables: ${missingEnv.join(', ')}`
  );

  process.exit(1);
}

// ==========================================
// 🤖 DISCORD CLIENT
// ==========================================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
  ],

  partials: [
    Partials.Channel,
  ],
});

// ==========================================
// 🎨 STYLES
// ==========================================

const styles = {
  successColor: chalk.bold.green,
  warningColor: chalk.bold.yellow,
  infoColor: chalk.bold.blue,
  commandColor: chalk.bold.cyan,
  userColor: chalk.bold.magenta,
  errorColor: chalk.red,
  highlightColor: chalk.bold.hex('#FFA500'),
  accentColor: chalk.bold.hex('#00FF7F'),
  secondaryColor: chalk.hex('#ADD8E6'),
  primaryColor: chalk.bold.hex('#FF1493'),
  dividerColor: chalk.hex('#FFD700'),
};

global.styles = styles;

// ==========================================
// 🔍 DISCORD GATEWAY DEBUG
// ==========================================

client.on('debug', (message) => {
  console.log(`🔎 Discord Debug: ${message}`);
});
