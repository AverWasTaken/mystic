import { Message, ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
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

const command: Command = {
  name: 'mysticadeveryone',
  description: 'Our servers ad!',

  slashData: new SlashCommandBuilder()
    .setName('mysticadeveryone')
    .setDescription('Our servers ad with @everyone!')
    .setDefaultMemberPermissions(PermissionFlagsBits.MentionEveryone),

  async execute(message: Message): Promise<void> {
    await message.reply(`${MYSTIC_AD}
 @everyone <@${message.author.id}>!`);
  },

  async executeSlash(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.reply(`${MYSTIC_AD}
 @everyone <@${interaction.user.id}>!`);
  }
};

export = command;
