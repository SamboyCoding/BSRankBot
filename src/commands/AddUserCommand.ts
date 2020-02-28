import BaseCommand from './BaseCommand';
import {DMChannel, Guild, GuildMember, Message, TextChannel, User} from 'discord.js';
import DiscordUserRecord from '../entity/DiscordUserRecord';
import PlayerScraper from '../scrapers/PlayerScraper';
import ScoreSaberUserRecord from '../entity/ScoreSaberUserRecord';
import RoleManager from '../RoleManager';
import logger from '../Logger';
import CommonUtilities from '../CommonUtilities';

export default class AddMeCommand extends BaseCommand {

    public async execute(message: Message, channel: TextChannel | DMChannel, user: User, guild?: Guild, member?: GuildMember): Promise<void> {
        const target = guild.member(message.mentions.users.firstKey() || this.getArg(0));

        if (!target) {
            await message.reply('You must provide an @mention or a user id as the first argument with this command.');
            return;
        }

        const dUser = await DiscordUserRecord.findOne(target.id);

        let id = this.getArg(1);

        if (!id) {
            await message.reply('You must provide a scoresaber profile url as the second argument with this command.');
            return;
        }

        const startOfId = id.indexOf('/u/');
        if (startOfId !== -1)
            id = id.slice(startOfId + 3);
        else {
            await message.reply('Please use a valid scoresaber profile.');
            return;
        }

        let endOfId = id.indexOf('?');
        endOfId = endOfId < 0 ? id.indexOf('&') : endOfId;
        if (endOfId !== -1)
            id = id.slice(0, endOfId);

        // Idiot filter
        id = id.replace(/[^a-z0-9/:.]/gi, '');

        const sUser = await ScoreSaberUserRecord.findOne(id, {
            relations: ['discordUser']
        });

        if (sUser && sUser.discordUser) {
            await message.reply('That scoresaber account is already linked to a user');
            return;
        }

        if (dUser && dUser.scoreSaberProfile) {
            await message.reply('You have already linked your scoresaber account.');
            return;
        }

        const profile = await PlayerScraper.getDetailsForID(id);

        await message.reply(`Your account has been linked to the scoresaber account ${profile.name}`);

        CommonUtilities.linkScoresaberToDiscord(profile, member, dUser, sUser).catch(e => {
            logger.error('[AddUser] Exception linking! ' + e);
        });
    }

    public getDesc(): string {
        return 'Adds the specified user and their scoresaber profile to the database.';
    }

    public getName(): string {
        return 'add-user';
    }

    public requiresAdmin(): boolean {
        return true;
    }

    public mustBeRunInGuild(): boolean {
        return true;
    }
}
