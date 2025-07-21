const { SlashCommandBuilder } = require('discord.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('markpaid')
    .setDescription('Mark an order as paid and notify the buyer')
    .addStringOption(opt => opt.setName('order').setDescription('Order ID').setRequired(true))
    .addUserOption(opt => opt.setName('user').setDescription('Buyer\'s Discord user').setRequired(true)),
  async execute(interaction) {
    const orderId = interaction.options.getString('order');
    const user = interaction.options.getUser('user');
    await user.send(`✅ Your payment for order #${orderId} has been confirmed! You will receive your delivery link shortly.`);
    await interaction.reply({ content: `Marked order #${orderId} as paid for ${user.tag}.`, ephemeral: true });
  }
};
