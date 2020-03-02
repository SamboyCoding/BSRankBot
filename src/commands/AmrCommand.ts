import BaseCommand from './BaseCommand';
import {DMChannel, Guild, GuildMember, Message, TextChannel, User} from 'discord.js';
import DiscordUserRecord from '../entity/DiscordUserRecord';
import PlayerScraper from '../scrapers/PlayerScraper';

export default class AmrCommand extends BaseCommand {
    protected async execute(message: Message, channel: TextChannel | DMChannel, user: User, guild?: Guild, member?: GuildMember): Promise<void> {
        const discordProfile = (await DiscordUserRecord.findOne(user.id));

        if (!discordProfile) {
            await message.reply(`You're not in the database`);
            return;
        }

        const ssProfile = discordProfile.scoreSaberProfile;

        const userData = await PlayerScraper.getDetailsForPlayer(ssProfile);
        const oneLower = await PlayerScraper.getDetailsForLeaderboardPosition(userData.regionalRank + 1, userData.region);

        if(userData.regionalRank === 1) {
            await message.reply(`You are ${(userData.pp - oneLower.pp).toFixed(2)}PP above ${oneLower.name}`);
            return;
        }

        const oneHigher = await PlayerScraper.getDetailsForLeaderboardPosition(userData.regionalRank - 1, userData.region);

        let messageBody = `__**Regional ranks around you:**__\n`;
        messageBody += `${oneHigher.regionalRank} **${oneHigher.name}** has ${(oneHigher.pp - userData.pp).toFixed(2)} more PP than you.\n`;
        messageBody += `${userData.regionalRank} **You (${userData.name})** have ${userData.pp}PP.\n`;
        messageBody += `${oneLower.regionalRank} **${oneLower.name}** has ${(userData.pp - oneLower.pp).toFixed(2)} less PP than you.\n`;

        await message.channel.send(messageBody);
    }

    getDesc(): string {
        return 'Returns the pp diff of you and those around you in the regional leaderboard.';
    }

    getName(): string {
        return 'amr';
    }

    mustBeRunInGuild(): boolean {
        return true;
    }

    requiresAdmin(): boolean {
        return false;
    }
}
