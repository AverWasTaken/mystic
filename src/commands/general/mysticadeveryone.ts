import { Message, ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import type { Command } from '../../types';

const MYSTIC_AD = `# 𝐌𝐲𝐬𝐭𝐢𝐜┃Editing and Resources
Your ultimate source to up your editing skills.
<:bluedot:1466392871480594443>What we offer:
 ・Free After Effects and Plugins
 ・ Tutorials
 ・ Edit audios • SFX • Overlays
 ・ After Effects & Alight Motion free presets
 ・ Skilled editors • Friendly Community • Active support
 ・ Grow our skill, level up your edits.
<:bluedot:1466392871480594443>What we're looking for:
 ・ Friendly members
 ・ Editors
 ・ Boosters
And you! <:w_whitestar:1466392991597068553>
[Join Mystic now.](https://discord.gg/M7Z7BquZCS)`;

const PERMISSION_DENIED_EMBED = new EmbedBuilder()
  .setColor(0xED4245)
  .setDescription('❌ You don\'t have permission to use this command.');

const command: Command = {
  name: 'mysticadeveryone',
  description: 'Our servers ad!',

  slashData: new SlashCommandBuilder()
    .setName('mysticadeveryone')
    .setDescription('Our servers ad with @everyone!')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(message: Message): Promise<void> {
    if (!message.member?.permissions.has(PermissionFlagsBits.Administrator)) {
      await message.reply({ embeds: [PERMISSION_DENIED_EMBED] });
      return;
    }
    await message.reply(`${MYSTIC_AD}
 @everyone <@${message.author.id}>!`);
  },

  async executeSlash(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({ embeds: [PERMISSION_DENIED_EMBED], ephemeral: true });
      return;
    }
    await interaction.reply(`${MYSTIC_AD}
 @everyone <@${interaction.user.id}>!`);
  }
};

export = command;
