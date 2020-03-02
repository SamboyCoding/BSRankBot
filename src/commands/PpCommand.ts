import BaseCommand from './BaseCommand';
import {DMChannel, Guild, GuildMember, Message, TextChannel, User} from 'discord.js';
import DiscordUserRecord from '../entity/DiscordUserRecord';
import PlayerScraper from '../scoresaber/scrapers/PlayerScraper';

export default class PingCommand extends BaseCommand {

    public async execute(message: Message, channel: TextChannel | DMChannel, user: User, guild?: Guild, member?: GuildMember): Promise<void> {
        const discordProfile = (await DiscordUserRecord.findOne(user.id));

        if (!discordProfile) {
            await message.reply(`You're not in the database`);
            return;
        }

        const ssProfile = discordProfile.scoreSaberProfile;

        const playerData = await PlayerScraper.getDetailsForPlayer(ssProfile);

        await message.reply(`You have ${playerData.pp}PP`);
    }

    public getDesc(): string {
        return 'Returns your pp';
    }

    public getName(): string {
        return 'pp';
    }

    public requiresAdmin(): boolean {
        return false;
    }

    public mustBeRunInGuild(): boolean {
        return false;
    }
}
