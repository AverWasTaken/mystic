import { Message, ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import type { Command } from '../../types';

const MYSTIC_MESSAGE = `𝐌𝐲𝐬𝐭𝐢𝐜 is a brand new editing community with free presets and editing audios with scenepacks on the way. it has an active community and more importantly a friendly one. join 𝐌𝐲𝐬𝐭𝐢𝐜 now to improve your editing skills and meet new people. https://discord.gg/SCvdmx5WdP made by .biscovfx`;

const PERMISSION_DENIED_EMBED = new EmbedBuilder()
  .setColor(0xED4245)
  .setDescription('❌ You don\'t have permission to use this command.');

const command: Command = {
  name: 'mystic',
  description: 'Our servers invite!',

  slashData: new SlashCommandBuilder()
    .setName('mystic')
    .setDescription('Our servers invite!')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(message: Message): Promise<void> {
    if (!message.member?.permissions.has(PermissionFlagsBits.Administrator)) {
      await message.reply({ embeds: [PERMISSION_DENIED_EMBED] });
      return;
    }
    await message.reply(`${MYSTIC_MESSAGE}
  <@${message.author.id}>!`);
  },

  async executeSlash(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({ embeds: [PERMISSION_DENIED_EMBED], ephemeral: true });
      return;
    }
    await interaction.reply(`${MYSTIC_MESSAGE}
  <@${interaction.user.id}>!`);
  }
};

export = command;
