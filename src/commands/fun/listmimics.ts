import { Message, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import type { Command } from '../../types';

const command: Command = {
  name: 'listmimics',
  description: 'Lists users currently being mimicked in this server.',

  slashData: new SlashCommandBuilder()
    .setName('listmimics')
    .setDescription('Lists users currently being mimicked in this server'),

  async execute(message: Message): Promise<void> {
    const guildId = message.guild?.id;

    if (!guildId) {
      await message.reply('This command can only be used in a server.');
      return;
    }

    const targets = message.client.mimicTargets[guildId];

    if (!targets || targets.size === 0) {
      await message.reply('No users are currently being mimicked.');
      return;
    }

    const usernames = await Promise.all(
      Array.from(targets).map(async id => {
        const user = await message.client.users.fetch(id).catch(() => null);
        return user ? `• ${user.tag}` : `• Unknown user (ID: ${id})`;
      })
    );

    await message.reply(`🤖 Currently mimicking:\n${usernames.join('\n')}`);
  },

  async executeSlash(interaction: ChatInputCommandInteraction): Promise<void> {
    const guildId = interaction.guild?.id;

    if (!guildId) {
      await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
      return;
    }

    const targets = interaction.client.mimicTargets[guildId];

    if (!targets || targets.size === 0) {
      await interaction.reply('No users are currently being mimicked.');
      return;
    }

    const usernames = await Promise.all(
      Array.from(targets).map(async id => {
        const user = await interaction.client.users.fetch(id).catch(() => null);
        return user ? `• ${user.tag}` : `• Unknown user (ID: ${id})`;
      })
    );

    await interaction.reply(`🤖 Currently mimicking:\n${usernames.join('\n')}`);
  }
};

export = command;
