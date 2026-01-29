import {
  Client,
  Collection,
  Message,
  ChatInputCommandInteraction,
  RESTPostAPIChatInputApplicationCommandsJSONBody
} from 'discord.js';

// Command structure for dual prefix/slash commands
export interface Command {
  name: string;
  description: string;
  aliases?: string[];
  // Prefix command handler
  execute: (message: Message, args: string[]) => Promise<void>;
  // Slash command handler (optional - if not provided, command won't have slash support)
  executeSlash?: (interaction: ChatInputCommandInteraction) => Promise<void>;
  // Slash command builder data (optional) - any object with toJSON method
  slashData?: { toJSON: () => RESTPostAPIChatInputApplicationCommandsJSONBody };
}

// Extended client with custom properties
export interface MysticClient extends Client {
  commands: Collection<string, Command>;
  targetUserId: string | null;
  autoReactEnabled: boolean;
  mimicTargets: Record<string, Set<string>>;
}

// Augment discord.js module
declare module 'discord.js' {
  interface Client {
    commands: Collection<string, Command>;
    targetUserId: string | null;
    autoReactEnabled: boolean;
    mimicTargets: Record<string, Set<string>>;
  }
}
