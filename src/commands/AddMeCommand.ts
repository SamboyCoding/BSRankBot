import BaseCommand from './BaseCommand';
import {DMChannel, Guild, GuildMember, Message, TextChannel, User} from 'discord.js';
import DiscordUserRecord from '../entity/DiscordUserRecord';
import PlayerScraper from '../scrapers/PlayerScraper';
import ScoreSaberUserRecord from '../entity/ScoreSaberUserRecord';

export default class AddMeCommand extends BaseCommand {

    public async execute(message: Message, channel: TextChannel | DMChannel, user: User, guild?: Guild, member?: GuildMember): Promise<any> {
        let dUser = await DiscordUserRecord.findOne(user.id);
        let id = this.getArg(0);

        if (!id)
            return channel.send('You must provide a scoresaber profile url with this command.');

        const startOfId = id.indexOf('/u/');
        if (startOfId !== -1)
            id = id.slice(startOfId + 3);
        else
            return message.channel.send('Please use a valid scoresaber profile.');

        let endOfId = id.indexOf('?');
        endOfId = endOfId < 0 ? id.indexOf("&") : endOfId;
        if (endOfId !== -1)
            id = id.slice(0, endOfId);

        // Idiot filter
        id = id.replace(/[^a-z0-9/:.]/gi, '');

        let sUser = await ScoreSaberUserRecord.findOne(id, {
            relations: ['discordUser']
        });

        if (sUser && sUser.discordUser)
            return message.channel.send('That scoresaber account is already linked to a user');

        if (dUser && dUser.scoreSaberProfile)
            return message.channel.send('You have already linked your scoresaber account.');

        const profile = await PlayerScraper.getDetailsForID(id);

        await message.channel.send(`Your account has been linked to the scoresaber account ${profile.name}`);

        sUser = sUser || new ScoreSaberUserRecord();
        dUser = dUser || new DiscordUserRecord();

        dUser.id = user.id;
        sUser.id = id;

        await dUser.save();

        sUser.discordUser = dUser;
        await sUser.save();

        dUser.scoreSaberProfile = sUser;
        await dUser.save();

        //TODO: Add roles.
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
