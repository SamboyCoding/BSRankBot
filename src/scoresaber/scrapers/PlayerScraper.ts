import ScoreSaberUserRecord from '../../entity/ScoreSaberUserRecord';
import PlayerData from './PlayerData';
import logger from '../../Logger';
import axios from 'axios';
import * as cheerio from "cheerio";
import {GuildMember, User} from 'discord.js';
import DiscordUserRecord from '../../entity/DiscordUserRecord';
import index from '../../commands';

export default class PlayerScraper {
    /**
     * Loads data for a specific player from the scoresaber server. Usually takes less than a second.
     * @param player The player to load data for.
     */
    public static async getDetailsForPlayer(player: ScoreSaberUserRecord): Promise<PlayerData> {
        logger.debug(`[RegionalScraper::player] Loading data for scoresaber user ${player.id}`);
        const response = await axios.get<string>(`https://scoresaber.com/u/${player.id}`);
        const html = response.data as string;

        const ul = cheerio(".columns .column:not(.is-narrow) ul", html)[0];

        const rankingLi = cheerio(`strong:contains("Player Ranking:")`, ul).parent().slice(0, 1);
        const links = cheerio('a', rankingLi);

        const regionLink = links.slice(-1).attr('href');
        const region = regionLink.slice(-2);

        const rankingAnchors = cheerio("li:first-child a", ul);
        const globalRank = Number(rankingAnchors.slice(0, 1).text().slice(1).replace(',', ''));
        const regionalRank = Number(rankingAnchors.slice(1, 2).text().slice(2).replace(',', ''));

        const ppLi = cheerio(`strong:contains("Performance Points:")`, ul).parent().slice(0, 1);

        const pp = Number(ppLi.text().replace('pp', '').replace(/\s/g, '').replace('PerformancePoints:', '').replace(",", ""));
        const name = cheerio('.title.is-5 a', html).text().trim();

        return {
            id: player.id,
            regionalRank,
            region,
            globalRank,
            pp,
            name
        }
    }

    public static async getDetailsForID(id: string): Promise<PlayerData> {
        const player = new ScoreSaberUserRecord();
        const idx = id.indexOf("&");
        if(idx > 0)
            id = id.substr(0, idx);
        player.id = id;
        return PlayerScraper.getDetailsForPlayer(player);
    }

    public static async getDetailsForDiscordUser(user: User | GuildMember): Promise<PlayerData> {
        logger.debug(`[PlayerScraper::discord] Looking up discord record for snowflake ${user.id}`);

        //Get the user's discord record from their id
        const profile = await DiscordUserRecord.findOne(user.id);

        if(!profile)
            return null;

        //And get their scoresaber profile id
        const ssUserId = profile.scoreSaberProfile.id;

        //Fetch their profile
        return await PlayerScraper.getDetailsForID(ssUserId);
    }

    public static async getDetailsForLeaderboardPosition(position: number, region: string = null): Promise<PlayerData> {
        logger.debug(`[PlayerScraper::pos] Looking up id for user in leaderboard pos ${position} in ${region || 'global'} leaderboard`);

        const pageNum = Math.ceil(position / 50);

        const response = await axios.get<string>(`https://scoresaber.com/global/${pageNum}/${region ? `?country=${region}`: ''}`);

        const html = response.data;
        const rows = cheerio('tr', html);

        const row = position % 50 == 0 ? 50 : position % 50;

        if(rows.length <= row)
            throw Error("Invalid position (< 0 or > total player count?)");

        const url = cheerio('a', rows[row]).attr("href");

        const id = url.replace("/u/", "");

        return PlayerScraper.getDetailsForID(id);
    }
}
