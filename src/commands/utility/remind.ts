import { 
  Message, 
  ChatInputCommandInteraction, 
  SlashCommandBuilder,
  EmbedBuilder
} from 'discord.js';
import type { Command } from '../../types';
import { 
  createReminder, 
  parseTimeString, 
  formatTimeUntil,
  getUserReminders,
  deleteReminder
} from '../../utils/reminders';

const REMINDER_COLOR = 0xFFD700; // Gold

const command: Command = {
  name: 'remind',
  description: 'Set a reminder to be pinged later',

  slashData: new SlashCommandBuilder()
    .setName('remind')
    .setDescription('Set a reminder to be pinged later')
    .addSubcommand(subcommand =>
      subcommand
        .setName('set')
        .setDescription('Create a new reminder')
        .addStringOption(option =>
          option
            .setName('time')
            .setDescription('When to remind you (e.g., 10m, 1h, 2d)')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('message')
            .setDescription('What to remind you about')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('List your pending reminders')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('cancel')
        .setDescription('Cancel a reminder')
        .addStringOption(option =>
          option
            .setName('id')
            .setDescription('Reminder ID (from /remind list)')
            .setRequired(true)
        )
    ) as SlashCommandBuilder,

  async execute(message: Message, args: string[]): Promise<void> {
    if (!message.guild) {
      await message.reply('This command can only be used in a server.');
      return;
    }

    if (args.length < 2) {
      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xFF5555)
            .setTitle('❌ Invalid Usage')
            .setDescription('Usage: `!remind <time> <message>`\nExample: `!remind 1h Take a break`')
        ]
      });
      return;
    }

    const timeStr = args[0];
    const reminderMessage = args.slice(1).join(' ');

    const ms = parseTimeString(timeStr);
    if (!ms) {
      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xFF5555)
            .setTitle('❌ Invalid Time Format')
            .setDescription('Use formats like: `10s`, `10m`, `1h`, `2d`')
        ]
      });
      return;
    }

    // Max 30 days
    if (ms > 30 * 24 * 60 * 60 * 1000) {
      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xFF5555)
            .setTitle('❌ Time Too Long')
            .setDescription('Reminders can be set for a maximum of 30 days.')
        ]
      });
      return;
    }

    const fireAt = Date.now() + ms;

    try {
      await createReminder(
        message.author.id,
        message.channel.id,
        message.guild.id,
        reminderMessage,
        fireAt
      );

      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(REMINDER_COLOR)
            .setTitle('⏰ Reminder Set!')
            .setDescription(`I'll remind you in **${formatTimeUntil(ms)}**`)
            .addFields({ name: 'Message', value: reminderMessage })
            .setTimestamp(new Date(fireAt))
        ]
      });
    } catch (err) {
      console.error('Failed to create reminder:', err);
      await message.reply('Failed to create reminder. Please try again.');
    }
  },

  async executeSlash(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild) {
      await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
      return;
    }

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'set') {
      const timeStr = interaction.options.getString('time', true);
      const reminderMessage = interaction.options.getString('message', true);

      const ms = parseTimeString(timeStr);
      if (!ms) {
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(0xFF5555)
              .setTitle('❌ Invalid Time Format')
              .setDescription('Use formats like: `10s`, `10m`, `1h`, `2d`')
          ],
          ephemeral: true
        });
        return;
      }

      // Max 30 days
      if (ms > 30 * 24 * 60 * 60 * 1000) {
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(0xFF5555)
              .setTitle('❌ Time Too Long')
              .setDescription('Reminders can be set for a maximum of 30 days.')
          ],
          ephemeral: true
        });
        return;
      }

      const fireAt = Date.now() + ms;

      try {
        await createReminder(
          interaction.user.id,
          interaction.channel!.id,
          interaction.guild.id,
          reminderMessage,
          fireAt
        );

        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(REMINDER_COLOR)
              .setTitle('⏰ Reminder Set!')
              .setDescription(`I'll remind you in **${formatTimeUntil(ms)}**`)
              .addFields({ name: 'Message', value: reminderMessage })
              .setTimestamp(new Date(fireAt))
          ]
        });
      } catch (err) {
        console.error('Failed to create reminder:', err);
        await interaction.reply({ content: 'Failed to create reminder. Please try again.', ephemeral: true });
      }
    } else if (subcommand === 'list') {
      try {
        const reminders = await getUserReminders(interaction.user.id);

        if (reminders.length === 0) {
          await interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(REMINDER_COLOR)
                .setTitle('📋 Your Reminders')
                .setDescription('You have no pending reminders.')
            ],
            ephemeral: true
          });
          return;
        }

        const reminderList = reminders.map((r, i) => {
          const timeLeft = r.fireAt - Date.now();
          const shortId = r._id.slice(-6); // Last 6 chars of ID
          return `**${i + 1}.** \`${shortId}\` - ${r.message}\n   ⏰ Fires in ${formatTimeUntil(timeLeft)}`;
        }).join('\n\n');

        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(REMINDER_COLOR)
              .setTitle('📋 Your Reminders')
              .setDescription(reminderList)
              .setFooter({ text: 'Use /remind cancel <id> to cancel a reminder' })
          ],
          ephemeral: true
        });
      } catch (err) {
        console.error('Failed to list reminders:', err);
        await interaction.reply({ content: 'Failed to list reminders. Please try again.', ephemeral: true });
      }
    } else if (subcommand === 'cancel') {
      const idInput = interaction.options.getString('id', true);

      try {
        const reminders = await getUserReminders(interaction.user.id);
        
        // Find reminder by partial ID match
        const reminder = reminders.find(r => r._id.endsWith(idInput) || r._id === idInput);

        if (!reminder) {
          await interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(0xFF5555)
                .setTitle('❌ Reminder Not Found')
                .setDescription('Could not find a reminder with that ID. Use `/remind list` to see your reminders.')
            ],
            ephemeral: true
          });
          return;
        }

        await deleteReminder(reminder._id);

        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(REMINDER_COLOR)
              .setTitle('🗑️ Reminder Cancelled')
              .setDescription(`Cancelled reminder: "${reminder.message}"`)
          ],
          ephemeral: true
        });
      } catch (err) {
        console.error('Failed to cancel reminder:', err);
        await interaction.reply({ content: 'Failed to cancel reminder. Please try again.', ephemeral: true });
      }
    }
  }
};

export = command;
