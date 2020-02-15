import {DMChannel, Guild, GuildMember, Message, TextChannel, User} from 'discord.js';

export default abstract class BaseCommand {
    private message: Message;

    public abstract getName(): string;

    public abstract getDesc(): string;

    public abstract requiresAdmin(): boolean;

    public abstract mustBeRunInGuild(): boolean

    protected getArg(index: number): string {
        const split = this.message.content.split(" ");
        return split[index + 1] || null;
    }

    public async run(message: Message, channel: TextChannel | DMChannel, user: User, guild?: Guild, member?: GuildMember): Promise<void> {
        this.message = message;

        this.execute(message, channel, user, guild, member);
    }

    protected abstract async execute(message: Message, channel: TextChannel | DMChannel, user: User, guild?: Guild, member?: GuildMember): Promise<void>;
}
