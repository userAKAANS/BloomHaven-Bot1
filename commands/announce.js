const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('announce')
    .setDescription('Send a custom announcement with optional ping and image')
    .addStringOption(option =>
      option.setName('text')
        .setDescription('The message you want to announce')
        .setRequired(true))
    .addMentionableOption(option =>
      option.setName('ping')
        .setDescription('Optional role or user to ping'))
    .addAttachmentOption(option =>
      option.setName('image')
        .setDescription('Optional image to include')),

  async execute(interaction) {
    const text = interaction.options.getString('text');
    const ping = interaction.options.getMentionable('ping');
    const image = interaction.options.getAttachment('image');

    const embed = new EmbedBuilder()
      .setDescription(text)
      .setColor(0x2ecc71)
      .setTimestamp();

    if (image && image.contentType?.startsWith('image')) {
      embed.setImage(image.url);
    }

    const content = ping ? `${ping}` : null;

    await interaction.reply({ content: '✅ Announcement sent!', ephemeral: true });

    await interaction.channel.send({ content, embeds: [embed] });
  }
};
