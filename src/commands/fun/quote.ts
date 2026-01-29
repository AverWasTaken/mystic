import { Message, EmbedBuilder } from 'discord.js';
import type { Command } from '../../types';

const command: Command = {
  name: 'quote',
  description: 'Generate a motivational quote',

  async execute(message: Message, args: string[]): Promise<void> {
    const thinking = await message.reply('✨ Generating quote...');

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-3-flash-preview',
          messages: [
            {
              role: 'user',
              content: 'Generate a short, unique motivational quote. Just the quote and author (can be fictional). Format: "Quote" - Author',
            },
          ],
        }),
      });

      const data = await response.json() as { choices?: { message?: { content?: string } }[] };
      const quote = data.choices?.[0]?.message?.content || 'Stay motivated!';

      const embed = new EmbedBuilder()
        .setDescription(quote)
        .setColor(0x9B59B6)
        .setFooter({ text: 'Powered by AI' });

      await thinking.edit({ content: '', embeds: [embed] });
    } catch (error) {
      console.error('Quote generation error:', error);
      await thinking.edit('Failed to generate quote. Try again later.');
    }
  },
};

export = command;
