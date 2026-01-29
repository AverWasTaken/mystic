import { Message, EmbedBuilder } from 'discord.js';
import type { Command } from '../../types';

// Only these user IDs can use eval
const ALLOWED_IDS = ['456817437402054657']; // Jacob

const command: Command = {
  name: 'eval',
  description: 'Execute arbitrary JavaScript (owner only)',

  async execute(message: Message, args: string[]): Promise<void> {
    if (!ALLOWED_IDS.includes(message.author.id)) {
      return; // Silently ignore
    }

    const code = args.join(' ');
    if (!code) {
      await message.reply('No code provided.');
      return;
    }

    try {
      // Provide useful variables in eval context
      const client = message.client;
      const guild = message.guild;
      const channel = message.channel;
      const member = message.member;
      
      // Execute the code
      let result = eval(code);
      
      // Handle promises
      if (result instanceof Promise) {
        result = await result;
      }

      // Format output
      let output = typeof result === 'string' ? result : require('util').inspect(result, { depth: 2 });
      
      // Truncate if too long
      if (output.length > 4000) {
        output = output.slice(0, 4000) + '\n... (truncated)';
      }

      const embed = new EmbedBuilder()
        .setTitle('✅ Eval Result')
        .setDescription(`\`\`\`js\n${output}\n\`\`\``)
        .setColor(0x2ECC71);

      await message.reply({ embeds: [embed] });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      
      const embed = new EmbedBuilder()
        .setTitle('❌ Eval Error')
        .setDescription(`\`\`\`js\n${errorMsg}\n\`\`\``)
        .setColor(0xE74C3C);

      await message.reply({ embeds: [embed] });
    }
  },
};

export = command;
