import BaseCommand from './BaseCommand';
import {DMChannel, Guild, GuildMember, Message, TextChannel, User} from 'discord.js';

export default class PingCommand extends BaseCommand {

    public async execute(message: Message, channel: TextChannel | DMChannel, user: User, guild?: Guild, member?: GuildMember): Promise<void> {
        await channel.send("🏓 Pong!");
    }

    public getDesc(): string {
        return 'Ping pong';
    }

    public getName(): string {
        return 'ping';
    }

    public requiresAdmin(): boolean {
        return true;
    }

    public mustBeRunInGuild(): boolean {
        return false;
    }
}
