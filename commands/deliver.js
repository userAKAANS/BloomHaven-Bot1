const { SlashCommandBuilder } = require('discord.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('deliver')
    .setDescription('Send the private server link to the buyer')
    .addStringOption(opt => opt.setName('order').setDescription('Order ID').setRequired(true))
    .addUserOption(opt => opt.setName('user').setDescription('Buyer\'s Discord user').setRequired(true))
    .addStringOption(opt => opt.setName('link').setDescription('Private server link').setRequired(true)),
  async execute(interaction) {
    const orderId = interaction.options.getString('order');
    const user = interaction.options.getUser('user');
    const link = interaction.options.getString('link');
    await user.send(`🚪 Your delivery for order #${orderId} is ready!\n\nJoin this private Grow a Garden server:\n${link}`);
    await interaction.reply({ content: `Sent delivery link for order #${orderId} to ${user.tag}.`, ephemeral: true });
  }
};
