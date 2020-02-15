import BaseCommand from './BaseCommand';
import {DMChannel, Guild, GuildMember, Message, TextChannel, User} from 'discord.js';
import DiscordUserRecord from '../entity/DiscordUserRecord';
import PlayerScraper from '../scrapers/PlayerScraper';
import ScoreSaberUserRecord from '../entity/ScoreSaberUserRecord';
import RoleManager from '../RoleManager';
import logger from '../Logger';

export default class AddMeCommand extends BaseCommand {

    public async execute(message: Message, channel: TextChannel | DMChannel, user: User, guild?: Guild, member?: GuildMember): Promise<void> {
        let dUser = await DiscordUserRecord.findOne(user.id);
        let id = this.getArg(0);

        if (!id) {
            await channel.send('You must provide a scoresaber profile url with this command.');
            return;
        }

        const startOfId = id.indexOf('/u/');
        if (startOfId !== -1)
            id = id.slice(startOfId + 3);
        else {
            await message.channel.send('Please use a valid scoresaber profile.');
            return;
        }

        let endOfId = id.indexOf('?');
        endOfId = endOfId < 0 ? id.indexOf('&') : endOfId;
        if (endOfId !== -1)
            id = id.slice(0, endOfId);

        // Idiot filter
        id = id.replace(/[^a-z0-9/:.]/gi, '');

        let sUser = await ScoreSaberUserRecord.findOne(id, {
            relations: ['discordUser']
        });

        if (sUser && sUser.discordUser) {
            await message.channel.send('That scoresaber account is already linked to a user');
            return;
        }

        if (dUser && dUser.scoreSaberProfile) {
            await message.channel.send('You have already linked your scoresaber account.');
            return;
        }

        const profile = await PlayerScraper.getDetailsForID(id);

        await message.channel.send(`Your account has been linked to the scoresaber account ${profile.name}`);

        logger.info(`[AddMe] Linking scoresaber profile ${id} to discord user ${user.id}`);

        sUser = sUser || new ScoreSaberUserRecord();
        dUser = dUser || new DiscordUserRecord();

        dUser.id = user.id;
        sUser.id = id;

        await dUser.save();

        sUser.discordUser = dUser;
        await sUser.save();

        dUser.scoreSaberProfile = sUser;
        await dUser.save();

        logger.debug(`[AddMe] Adding region role to ${user.id}`);
        await RoleManager.addRegionRoleToMember(member);

        logger.debug(`[AddMe] Adding regional position role to ${user.id}`);
        await RoleManager.updateRegionalPositionRole(member);
    }

    public getDesc(): string {
        return 'Adds the user and their scoresaber profile to the database.';
    }

    public getName(): string {
        return 'add-me';
    }

    public requiresAdmin(): boolean {
        return false;
    }

    public mustBeRunInGuild(): boolean {
        return true;
    }
}
