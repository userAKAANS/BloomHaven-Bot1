require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMembers
  ],
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

  setTimeout(async () => {
    const { REST, Routes } = require('discord.js');
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

// 🌐 Express App
const app = express();
const PORT = process.env.PORT || 3000;
app.use(bodyParser.json());

app.get("/", (req, res) => res.send("Bloom Haven Bot is alive"));

// 🛒 Shopify Webhook with Dynamic Payment Instructions
app.post('/shopify-webhook', async (req, res) => {
  try {
    const order = req.body;

    const robloxUser = order.customer?.first_name || 'Unknown Roblox User';
    const discordId = order.customer?.last_name || null;
    const orderId = order.name || 'No Order ID';
    const paymentMethod = (order.payment_gateway_names?.[0] || 'Unknown').toLowerCase();

    console.log(`📦 New Order from Discord ID: ${discordId} | Order #${orderId} | Roblox: ${robloxUser} | Payment: ${paymentMethod}`);

    let targetUser = null;
    if (discordId) {
      try {
        targetUser = await client.users.fetch(discordId);
      } catch (e) {
        console.warn(`❌ Could not fetch user with ID ${discordId}:`, e);
      }
    }

    // Payment link and instructions
    let paymentLink = null;
    let instructions = '';

    if (paymentMethod.includes('paypal')) {
      paymentLink = 'https://www.paypal.com/paypalme/oilmoney001';
      instructions = `1️⃣ Donate the exact amount of your items via the PayPal link below.\n` +
                     `2️⃣ Ensure your name matches your order.\n` +
                     `3️⃣ Payment will be auto-verified shortly.`;
    } else if (paymentMethod.includes('ko-fi') || paymentMethod.includes('kofi')) {
      paymentLink = 'https://ko-fi.com/oilmoney01';
      instructions = `1️⃣ Send the correct amount for your item on Ko-fi.\n` +
                     `2️⃣ Use your Roblox name in the message.\n` +
                     `3️⃣ Payment will be auto-detected.`;
    } else if (paymentMethod.includes('robux')) {
      paymentLink = 'https://www.roblox.com/users/3378878237/profile';
      instructions = `1️⃣ Purchase a game pass worth the cost of your item (USD ➡️ Robux).\n` +
                     `2️⃣ Include your Discord or order ID in the message.\n` +
                     `3️⃣ You’ll receive delivery after Robux is confirmed.`;
    }

    if (targetUser) {
      let message =
        `🤖 **Order Confirmed Automatically**\n\n` +
        `🧾 **Order ID:** \`${orderId}\`\n` +
        `🎮 **Roblox Username:** \`${robloxUser}\`\n` +
        `💳 **Selected Payment Method:** \`${paymentMethod.toUpperCase()}\`\n\n`;

      if (paymentLink) {
        message += `✅ Your order has been registered and is now pending payment.\n\n` +
                   `🔗 **Payment Link:** ${paymentLink}\n\n` +
                   `${instructions}\n\n`;
      } else {
        message += `⚠️ Payment method not detected. Please complete payment using your selected method at checkout.\n\n`;
      }

      message +=
        `📡 Our system will automatically verify your payment.\n` +
        `📦 Once confirmed, your item will be queued for in-game delivery.\n\n` +
        `💬 This message was generated by **Bloom Haven AutoOrder v2.1**`;

      await targetUser.send(message);
      console.log(`📨 DM sent to ${discordId}`);
    } else {
      console.warn(`⚠️ Still couldn’t DM user with ID ${discordId} – not reachable.`);
    }

    res.status(200).send('Webhook received');
  } catch (error) {
    console.error('❌ Webhook Error:', error);
    res.status(500).send('Internal Error');
  }
});

app.listen(PORT, () => console.log(`🌐 Web server running on port ${PORT}`));
