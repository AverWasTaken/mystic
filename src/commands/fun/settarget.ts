import { Message, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import type { Command } from '../../types';

const command: Command = {
  name: 'settarget',
  description: 'Enable auto-react for a specific user. Usage: m!settarget @user',

  slashData: new SlashCommandBuilder()
    .setName('settarget')
    .setDescription('Enable auto skull react for a specific user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to target')
        .setRequired(true)
    ),

  async execute(message: Message, args: string[]): Promise<void> {
    const user = message.mentions.users.first();
    
    if (!user) {
      await message.reply('Please mention a user to target. Usage: `m!settarget @user`');
      return;
    }

    message.client.targetUserId = user.id;
    message.client.autoReactEnabled = true;

    await message.reply(`⨳ ${message.author.tag} is targeting user **${user.tag}**`);
    console.log(`AutoReact enabled for user: ${user.tag} (${user.id})`);
  },

  async executeSlash(interaction: ChatInputCommandInteraction): Promise<void> {
    const user = interaction.options.getUser('user', true);

    interaction.client.targetUserId = user.id;
    interaction.client.autoReactEnabled = true;

    await interaction.reply(`⨳ ${interaction.user.tag} is targeting user **${user.tag}**`);
    console.log(`AutoReact enabled for user: ${user.tag} (${user.id})`);
  }
};

export = command;
