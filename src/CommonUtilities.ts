import PlayerData from './scrapers/PlayerData';
import {GuildMember} from 'discord.js';
import logger from './Logger';
import ScoreSaberUserRecord from './entity/ScoreSaberUserRecord';
import DiscordUserRecord from './entity/DiscordUserRecord';
import RoleManager from './RoleManager';

export default class CommonUtils {
    public static async linkScoresaberToDiscord(scoresaber: PlayerData, discord: GuildMember, dUser: DiscordUserRecord, sUser: ScoreSaberUserRecord): Promise<void> {
        logger.info(`[LinkSS2Disc] Linking scoresaber profile ${scoresaber.id} to discord user ${discord.id}`);

        sUser = sUser || new ScoreSaberUserRecord();
        dUser = dUser || new DiscordUserRecord();

        dUser.id = discord.id;
        sUser.id = scoresaber.id;

        await dUser.save();

        sUser.discordUser = dUser;
        await sUser.save();

        dUser.scoreSaberProfile = sUser;
        await dUser.save();

        logger.debug(`[LinkSS2Disc] Adding region role to ${discord.id}`);
        await RoleManager.addRegionRoleToMember(discord);

        logger.debug(`[LinkSS2Disc] Adding regional position role to ${discord.id}`);
        await RoleManager.updateRegionalPositionRole(discord);
    }
}
