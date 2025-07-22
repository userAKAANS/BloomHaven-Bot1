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

// 🧠 Store message IDs by order ID
const messageMapPath = './messageMap.json';
let messageMap = {};
if (fs.existsSync(messageMapPath)) {
  messageMap = JSON.parse(fs.readFileSync(messageMapPath, 'utf8'));
}

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
      instructions = `1️⃣ Send **$${totalPrice}** via the PayPal link below.\n2️⃣ Include **Order ID: ${orderId}** in the note.\n3️⃣ Payment will be auto-verified.`;
    } else if (paymentMethod.includes('ko-fi') || paymentMethod.includes('kofi')) {
      paymentLink = 'https://ko-fi.com/oilmoney01';
      instructions = `1️⃣ Donate **$${totalPrice}** via Ko-fi.\n2️⃣ Include **Order ID: ${orderId}** in the message.\n3️⃣ Payment will be auto-detected.`;
    } else if (paymentMethod.includes('robux')) {
      paymentLink = 'https://www.roblox.com/users/3378878237/profile';
      instructions = `1️⃣ Purchase a game pass worth **$${totalPrice}** (USD ➡️ Robux).\n2️⃣ Add **Order ID: ${orderId}** to the gamepass or message.\n3️⃣ Delivery will follow confirmation.`;
    }

    if (targetUser) {
      let message =
        `🤖 **Order Confirmed Automatically**\n\n` +
        `🧾 **Order ID:** \`${orderId}\`\n🎮 **Roblox Username:** \`${robloxUser}\`\n💳 **Selected Payment Method:** \`${paymentMethod.toUpperCase()}\`\n\n` +
        `🛍️ **Items Ordered:**\n${itemList}\n💰 **Total: $${totalPrice.toFixed(2)}**\n\n`;

      if (paymentLink) {
        message += `✅ Your order has been registered and is now pending payment.\n\n🔗 **Payment Link:** ${paymentLink}\n\n${instructions}\n\n`;
      } else {
        message += `⚠️ Payment method not detected. Please complete payment manually.\n\n`;
      }

      message += `📡 Our system will automatically verify your payment.\n📦 Once confirmed, your **items** will be queued for in-game delivery.\n\n💬 This message was generated by **Bloom Haven AutoOrder v2.1**`;

      await targetUser.send(message);
      console.log(`📨 DM sent to ${discordId}`);
    }

    // 📄 Order log to staff channel
    const logChannelId = '1397212138753495062';
    const logChannel = await client.channels.fetch(logChannelId).catch(() => null);

    if (logChannel && logChannel.isTextBased()) {
      const embed = new EmbedBuilder()
        .setColor(0xfacc15)
        .setTitle('📥 New Bloom Haven Order')
        .addFields(
          { name: '🧾 Order ID', value: orderId, inline: true },
          { name: '🎮 Roblox', value: robloxUser, inline: true },
          { name: '💳 Payment', value: paymentMethod.toUpperCase(), inline: true },
          { name: '📌 Status', value: '⏳ Payment Pending', inline: false },
          { name: '🛒 Items', value: itemList.trim() || 'None', inline: false },
          { name: '💰 Total', value: `$${totalPrice.toFixed(2)}`, inline: true },
          { name: '👤 Buyer', value: `<@${discordId}>`, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: 'Bloom Haven AutoOrder v2.1' });

      const sentMsg = await logChannel.send({ embeds: [embed] });
      messageMap[orderId] = sentMsg.id;
      fs.writeFileSync(messageMapPath, JSON.stringify(messageMap, null, 2));
    }

    res.status(200).send('Webhook received');
  } catch (error) {
    console.error('❌ Webhook Error:', error);
    res.status(500).send('Internal Error');
  }
});

app.listen(PORT, () => console.log(`🌐 Web server running on port ${PORT}`));
