require('dotenv').config();
const { Client, GatewayIntentBits, Collection, EmbedBuilder } = require('discord.js');
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

// 🛒 Shopify Webhook
app.post('/shopify-webhook', async (req, res) => {
  try {
    const order = req.body;

    const robloxUser = order.customer?.first_name || 'Unknown Roblox User';
    const discordId = order.customer?.last_name || null;
    const orderId = order.name || 'No Order ID';
    const paymentMethod = (order.payment_gateway_names?.[0] || 'Unknown').toLowerCase();
    const lineItems = order.line_items || [];

    let totalPrice = 0;
    let itemList = '';

    for (const item of lineItems) {
      const name = item.title || 'Unknown Item';
      const quantity = item.quantity || 1;
      const price = parseFloat(item.price || 0);
      const subtotal = (price * quantity).toFixed(2);
      totalPrice += parseFloat(subtotal);
      itemList += `• ${name} ×${quantity} — $${subtotal}\n`;
    }

    let targetUser = null;
    if (discordId) {
      try {
        targetUser = await client.users.fetch(discordId);
      } catch (e) {
        console.warn(`❌ Could not fetch user with ID ${discordId}:`, e);
      }
    }

    let paymentLink = null;
    let instructions = '';

    if (paymentMethod.includes('paypal')) {
      paymentLink = 'https://www.paypal.com/paypalme/oilmoney001';
      instructions = `1️⃣ Send **$${totalPrice}** via the PayPal link below.\n` +
                     `2️⃣ Include **Order ID: ${orderId}** in the note.\n` +
                     `3️⃣ Payment will be auto-verified.`;
    } else if (paymentMethod.includes('ko-fi') || paymentMethod.includes('kofi')) {
      paymentLink = 'https://ko-fi.com/oilmoney01';
      instructions = `1️⃣ Donate **$${totalPrice}** via Ko-fi.\n` +
                     `2️⃣ Include **Order ID: ${orderId}** in the message.\n` +
                     `3️⃣ Payment will be auto-detected.`;
    } else if (paymentMethod.includes('robux')) {
      paymentLink = 'https://www.roblox.com/users/3378878237/profile';
      instructions = `1️⃣ Purchase a game pass worth **$${totalPrice}** (USD
