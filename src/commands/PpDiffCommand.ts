import BaseCommand from './BaseCommand';
import {DMChannel, Guild, GuildMember, Message, TextChannel, User} from 'discord.js';
import DiscordUserRecord from '../entity/DiscordUserRecord';
import PlayerScraper from '../scoresaber/scrapers/PlayerScraper';
import ScoreSaberUserRecord from '../entity/ScoreSaberUserRecord';
import PlayerData from '../scoresaber/scrapers/PlayerData';
import logger from '../Logger';

export default class PingCommand extends BaseCommand {

    public async execute(message: Message, channel: TextChannel | DMChannel, user: User, guild?: Guild, member?: GuildMember): Promise<void> {
        const discordProfile = (await DiscordUserRecord.findOne(user.id));

        if (!discordProfile) {
            await message.reply(`You're not in the database`);
            return;
        }

        const ssProfile = discordProfile.scoreSaberProfile;

        const userData = await PlayerScraper.getDetailsForPlayer(ssProfile);

        // let target = message.mentions.users.firstKey();
        let otherPersonData: PlayerData;

        // if(!target) {
            const target = this.getArg(0);

            const startOfId = target.indexOf('/u/');
            if (startOfId !== -1)
                otherPersonData = await PlayerScraper.getDetailsForID(target.slice(startOfId + 3));
            else {
                //Check for <number> [region]
                const rank = Number(target);

                if(isNaN(rank)) {
                    await message.reply("Please use a scoresaber profile, rank, or @mention");
                    return;
                }

                const region = this.getArg(1);

                otherPersonData = await PlayerScraper.getDetailsForLeaderboardPosition(rank, region);
            }
         // } else {
        //     const targetProf = await DiscordUserRecord.findOne(target);
        //     if(!targetProf) {
        //         await message.reply("That user is not in the database.");
        //         return;
        //     }
        //
        //     otherPersonData = await PlayerScraper.getDetailsForPlayer(targetProf.scoreSaberProfile);
        // }

        if(!otherPersonData) {
            await message.reply("Sorry, couldn't work out who you want to compare with.");
            return;
        }

        if(otherPersonData.id === userData.id) {
            await message.reply("You have the same PP as yourself.");
            return;
        }

        if(otherPersonData.pp > userData.pp)
            await message.reply(`${otherPersonData.name} has ${(otherPersonData.pp - userData.pp).toFixed(2)} more PP than you.`)
        else if(otherPersonData.pp < userData.pp)
            await message.reply(`${otherPersonData.name} has ${(userData.pp - otherPersonData.pp).toFixed(2)} less PP than you.`)
        else
            await message.reply(`Somehow you have exactly the same PP as ${otherPersonData.name} - you both have ${userData.pp}PP`)
    }

    public getDesc(): string {
        return 'Returns the difference in pp between you and someone else.';
    }

    public getName(): string {
        return 'pp-diff';
    }

    public requiresAdmin(): boolean {
        return false;
    }

    public mustBeRunInGuild(): boolean {
        return false;
    }
}
