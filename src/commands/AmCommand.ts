import BaseCommand from './BaseCommand';
import {DMChannel, Guild, GuildMember, Message, TextChannel, User} from 'discord.js';
import DiscordUserRecord from '../entity/DiscordUserRecord';
import PlayerScraper from '../scrapers/PlayerScraper';

export default class AmCommand extends BaseCommand {
    protected async execute(message: Message, channel: TextChannel | DMChannel, user: User, guild?: Guild, member?: GuildMember): Promise<void> {
        const ssProfile = (await DiscordUserRecord.findOne(user.id)).scoreSaberProfile;

        if (!ssProfile) {
            await message.reply(`You're not in the database`);
            return;
        }

        const userData = await PlayerScraper.getDetailsForPlayer(ssProfile);
        const oneLower = await PlayerScraper.getDetailsForLeaderboardPosition(userData.globalRank + 1);

        if(userData.globalRank === 1) {
            await message.reply(`You are ${(userData.pp - oneLower.pp).toFixed(2)}PP above ${oneLower.name}`);
            return;
        }

        const oneHigher = await PlayerScraper.getDetailsForLeaderboardPosition(userData.globalRank - 1);

        let messageBody = `__**Global ranks around you:**__\n`;
        messageBody += `${oneHigher.globalRank} **${oneHigher.name}** has ${(oneHigher.pp - userData.pp).toFixed(2)} more PP than you.\n`;
        messageBody += `${userData.globalRank} **You (${userData.name})** have ${userData.pp}PP.\n`;
        messageBody += `${oneLower.globalRank} **${oneLower.name}** has ${(userData.pp - oneLower.pp).toFixed(2)} less PP than you.\n`;

        await message.channel.send(messageBody);
    }

    getDesc(): string {
        return 'Returns the pp diff of you and those around you in the global leaderboard.';
    }

    getName(): string {
        return 'am';
    }

    mustBeRunInGuild(): boolean {
        return true;
    }

    requiresAdmin(): boolean {
        return false;
    }
}
