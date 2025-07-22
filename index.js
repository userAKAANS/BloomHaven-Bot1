require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

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

// Price Map
const prices = {
  "Raccoon": 12,
  "Sheckles": 10,
  "Dragonfly": 10,
  "Disco Bee": 13,
  "Queen Bee": 10,
  "Butterfly": 10,
  "Red Fox": 5,
  "Chicken Zombie": 4,
  "Cooked Owl": 4,
  "Bear Bee": 7,
  "Mimic Octopus": 14,
  "Fennec Fox": 13,
  "T-Rex": 9,
  "9-Tailed Fox": 16
};

// 🛒 Shopify Webhook
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

    // Load item from orders.json
    const ordersPath = path.join(__dirname, 'orders.json');
    let orders = {};
    if (fs.existsSync(ordersPath)) {
      orders = JSON.parse(fs.readFileSync(ordersPath, 'utf8'));
    }

    const itemName = orders[orderId] || 'your item';
    const itemPrice = prices[itemName] || 'unknown';

    // Build payment message
    let paymentLink = null;
    let instructions = '';

    if (paymentMethod.includes('paypal')) {
      paymentLink = 'https://www.paypal.com/paypalme/oilmoney001';
      instructions = `1️⃣ Send **$${itemPrice}** via the PayPal link below.\n` +
                     `2️⃣ Include **Order ID: ${orderId}** in the note.\n` +
                     `3️⃣ Payment will be auto-verified.`;
    } else if (paymentMethod.includes('ko-fi') || paymentMethod.includes('kofi')) {
      paymentLink = 'https://ko-fi.com/oilmoney01';
      instructions = `1️⃣ Donate **$${itemPrice}** via Ko-fi.\n` +
                     `2️⃣ Include **Order ID: ${orderId}** in the message.\n` +
                     `3️⃣ Payment will be auto-detected.`;
    } else if (paymentMethod.includes('robux')) {
      paymentLink = 'https://www.roblox.com/users/3378878237/profile';
      instructions = `1️⃣ Purchase a game pass worth **$${itemPrice}** (USD ➡️ Robux).\n` +
                     `2️⃣ Add **Order ID: ${orderId}** to the gamepass or message.\n` +
                     `3️⃣ Delivery will follow confirmation.`;
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
        message += `⚠️ Payment method not detected. Please complete payment manually.\n\n`;
      }

      message +=
        `📡 Our system will automatically verify your payment.\n` +
        `📦 Once confirmed, your **${itemName}** will be queued for in-game delivery.\n\n` +
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
