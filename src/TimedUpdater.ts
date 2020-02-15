import logger from './Logger';
import RegionalPlayerScraper from './scrapers/RegionalPlayerScraper';
import ScoreSaberUserRecord from './entity/ScoreSaberUserRecord';
import BSRankBot from './Bot';
import RoleManager from './RoleManager';
import {Guild} from 'discord.js';
import GlobalPlayerScraper from './scrapers/GlobalPlayerScraper';

export default class TimedUpdater {
    public static async updateForGuild(guild: Guild): Promise<void> {
        logger.info(`[TimedUpdater] Running automatic role update in guild ${guild.id} / "${guild.name}".`);

        //Get top [however many] pages for regional leaderboard
        logger.info("[TimedUpdater] Loading regional leaderboard...");
        const regional = await RegionalPlayerScraper.getPlayerList();

        //Map to discord users.
        const regionalDiscordUsers = await TimedUpdater.lookupUsers(regional, guild);

        //Removal all undeserved regionals
        logger.info(`[TimedUpdater] Removing regional roles from those that don't deserve them...`);
        await RoleManager.removeAllUndeservedRegionalRoles(regionalDiscordUsers);

        logger.info(`[TimedUpdater] Updating regional roles for ${regionalDiscordUsers.length} guild members.`);
        for (const user of regionalDiscordUsers) {
            await RoleManager.updateRegionalPositionRole(user);
        }

        //Now do global
        logger.info("[TimedUpdater] Loading global leaderboard...");
        const global = await GlobalPlayerScraper.getPlayerList();

        //Map to discord users.
        const globalDiscordUsers = await TimedUpdater.lookupUsers(global, guild);

        //Removal all undeserved globals
        logger.info(`[TimedUpdater] Removing global roles from those that don't deserve them...`);
        await RoleManager.removeAllUndeservedGlobalRoles(globalDiscordUsers);

        logger.info(`[TimedUpdater] Updating global roles for ${globalDiscordUsers.length} guild members.`);
        for (const user of globalDiscordUsers) {
            await RoleManager.updateGlobalPositionRole(user);
        }
    }

    private static async lookupUsers(users: ScoreSaberUserRecord[], guild: Guild) {
        //Do a database lookup for each one & filter out those we don't know
        logger.info(`[TimedUpdater] Looking up ${users.length} leaderboard users in database...`);
        const regionalRecords: ScoreSaberUserRecord[] = (await Promise.all(
            users.map(
                u => ScoreSaberUserRecord.findOne(u.id, {relations: ['discordUser']})
            )
        )).filter(r => r && r.discordUser);

        //Map to discord users.
        logger.info(`[TimedUpdater] Fetching ${regionalRecords.length} discord users...`);
        const discordUsers = (await Promise.all(regionalRecords.map(r => BSRankBot.discordClient.fetchUser(r.discordUser.id, true)))).filter(u => !!u)
            .map(u => guild.member(u))
            .filter(u => !!u);

        return discordUsers;
    }
}
