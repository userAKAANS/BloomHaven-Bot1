const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('whois')
    .setDescription('Get the Discord tag of a user by their ID and ping them')
    .addStringOption(opt =>
      opt.setName('id')
        .setDescription('The Discord user ID (e.g. 1234567890)')
        .setRequired(true)),

  async execute(interaction) {
    const id = interaction.options.getString('id');

    try {
      const user = await interaction.client.users.fetch(id);
      await interaction.reply({
        content: `🔍 <@${id}> is **${user.tag}**`,
        ephemeral: true
      });
    } catch (err) {
      console.error('❌ Error fetching user by ID:', err);
      await interaction.reply({ content: '❌ Invalid ID or user not found.', ephemeral: true });
    }
  }
};
