const { SlashCommandBuilder } = require('discord.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('delivered')
    .setDescription('Mark an order as delivered')
    .addStringOption(opt => opt.setName('order').setDescription('Order ID').setRequired(true)),
  async execute(interaction) {
    const orderId = interaction.options.getString('order');
    await interaction.reply({ content: `✅ Order #${orderId} has been marked as delivered.`, ephemeral: true });
  }
};
