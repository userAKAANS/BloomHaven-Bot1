const { SlashCommandBuilder, AttachmentBuilder, EmbedBuilder } = require('discord.js');

const VOUCH_CHANNEL_ID = '1390974381508923452'; // ✅ Bloom Haven Vouches Channel

module.exports = {
  data: new SlashCommandBuilder()
    .setName('vouch')
    .setDescription('Submit a vouch with an image and your comment')
    .addAttachmentOption(opt =>
      opt.setName('image')
        .setDescription('Upload an image of your item or delivery')
        .setRequired(true))
    .addStringOption(opt =>
      opt.setName('item')
        .setDescription('What item did you purchase?')
        .setRequired(true)
        .addChoices(
          { name: 'Raccoon', value: 'Raccoon' },
          { name: 'Sheckles', value: 'Sheckles' },
          { name: 'Disco Bee', value: 'Disco Bee' },
          { name: 'Queen Bee', value: 'Queen Bee' },
          { name: 'Butterfly', value: 'Butterfly' },
          { name: 'Dragonfly', value: 'Dragonfly' },
          { name: 'Red Fox', value: 'Red Fox' },
          { name: 'Chicken Zombie', value: 'Chicken Zombie' },
          { name: 'Mimic Octopus', value: 'Mimic Octopus' },
          { name: 'Fennec Fox', value: 'Fennec Fox' },
          { name: 'T-Rex', value: 'T-Rex' },
          { name: 'Kitsune', value: 'Kitsune' }
        ))
    .addStringOption(opt =>
      opt.setName('comment')
        .setDescription('Say something about your experience!')
        .setRequired(true)),

  async execute(interaction) {
    const image = interaction.options.getAttachment('image');
    const item = interaction.options.getString('item');
    const comment = interaction.options.getString('comment');

    const embed = new EmbedBuilder()
      .setTitle(`🛒 New Vouch for ${item}`)
      .setDescription(`💬 "${comment}"`)
      .setColor(0x2ECC71)
      .setFooter({ text: `Bloom Haven AutoOrder v2.1` })
      .setTimestamp()
      .setImage(image.url)
      .setAuthor({ name: `${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });

    try {
      const channel = await interaction.client.channels.fetch(VOUCH_CHANNEL_ID);
      await channel.send({ embeds: [embed] });
      await interaction.reply({ content: '✅ Thanks for your vouch! It’s been posted.', ephemeral: true });
    } catch (err) {
      console.error('❌ Failed to send vouch:', err);
      await interaction.reply({ content: '❌ Something went wrong posting your vouch.', ephemeral: true });
    }
  }
};
