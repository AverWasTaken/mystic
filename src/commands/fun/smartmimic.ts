import { Message, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import type { Command } from '../../types';

const command: Command = {
  name: 'smartmimic',
  description: 'Toggle smart mimic for a user. Usage: m!smartmimic @user',

  slashData: new SlashCommandBuilder()
    .setName('smartmimic')
    .setDescription('Toggle smart mimic for a user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to mimic')
        .setRequired(true)
    ),

  async execute(message: Message, args: string[]): Promise<void> {
    const target = message.mentions.users.first();
    const guildId = message.guild?.id;

    if (!target) {
      await message.reply('Please mention a user to mimic. Usage: `m!smartmimic @user`');
      return;
    }

    if (!guildId) {
      await message.reply('This command can only be used in a server.');
      return;
    }

    if (!message.client.mimicTargets[guildId]) {
      message.client.mimicTargets[guildId] = new Set();
    }

    const targets = message.client.mimicTargets[guildId];

    if (targets.has(target.id)) {
      targets.delete(target.id);
      await message.reply(`🛑 Stopped mimicking ${target.tag}`);
    } else {
      targets.add(target.id);
      await message.reply(`✅ Now mimicking ${target.tag}`);
    }
  },

  async executeSlash(interaction: ChatInputCommandInteraction): Promise<void> {
    const target = interaction.options.getUser('user', true);
    const guildId = interaction.guild?.id;

    if (!guildId) {
      await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
      return;
    }

    if (!interaction.client.mimicTargets[guildId]) {
      interaction.client.mimicTargets[guildId] = new Set();
    }

    const targets = interaction.client.mimicTargets[guildId];

    if (targets.has(target.id)) {
      targets.delete(target.id);
      await interaction.reply(`🛑 Stopped mimicking ${target.tag}`);
    } else {
      targets.add(target.id);
      await interaction.reply(`✅ Now mimicking ${target.tag}`);
    }
  }
};

export = command;
