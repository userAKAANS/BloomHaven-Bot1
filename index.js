require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.DirectMessages],
  partials: ['CHANNEL']
});

client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

client.once('ready', async () => {
  console.log(`✅ Bloom Haven Bot is online as ${client.user.tag}`);

  // 🔁 Register slash commands after 2 second delay
  setTimeout(async () => {
  if (true) {
      const { REST, Routes } = require('discord.js');
      const fs = require('fs');

      console.log('⌛ Waiting to register slash commands...');

      const commands = [];
      const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

      for (const file of commandFiles) {
        const command = require(`./commands/${file}`);
        commands.push(command.data.toJSON());
      }

      const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

      try {
        console.log('📤 Registering slash commands...');
        await rest.put(
          Routes.applicationCommands('1396258538460020856'),
          { body: commands }
        );
        console.log('✅ Slash commands registered successfully.');
      } catch (error) {
        console.error('❌ Failed to register commands:', error);
      }
    }
  }, 2000);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;
  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: '❌ There was an error executing this command.', ephemeral: true });
  }
});

client.login(process.env.DISCORD_TOKEN);

// 🌐 Express App for Webhook Listening
const app = express();
const PORT = process.env.PORT || 3000;
app.use(bodyParser.json());

app.get("/", (req, res) => res.send("Bloom Haven Bot is alive"));

// 🛒 Shopify Webhook to Auto-DM Buyers
app.post('/shopify-webhook', async (req, res) => {
  try {
    const order = req.body;

    const robloxUser = order.customer?.first_name || 'Unknown Roblox User';
    const discordTag = order.customer?.last_name || 'Unknown#0000';
    const orderId = order.name || 'No Order ID';

    console.log(`📦 New Order from ${discordTag} | Order #${orderId} | Roblox: ${robloxUser}`);

    const targetUser = client.users.cache.find(user => user.tag === discordTag);

    if (targetUser) {
      await targetUser.send(
        `✅ Thanks for ordering from **Bloom Haven**!\n\nYour order **${orderId}** was received.\nWe'll deliver your items in-game to **${robloxUser}** soon!`
      );
      console.log(`📨 DM sent to ${discordTag}`);
    } else {
      console.warn(`⚠️ Could not DM ${discordTag} – user not found in cache.`);
    }

    res.status(200).send('Webhook received');
  } catch (error) {
    console.error('❌ Webhook Error:', error);
    res.status(500).send('Internal Error');
  }
});

app.listen(PORT, () => console.log(`🌐 Web server running on port ${PORT}`));
