import ScoreSaberUserRecord from '../entity/ScoreSaberUserRecord';
import PlayerData from './PlayerData';
import logger from '../Logger';
import axios from 'axios';
import * as cheerio from "cheerio";

export default class PlayerScraper {
    /**
     * Loads data for a specific player from the scoresaber server. Usually takes less than a second.
     * @param player The player to load data for.
     */
    public static async getDetailsForPlayer(player: ScoreSaberUserRecord): Promise<PlayerData> {
        logger.debug(`[RegionalScraper::player] Loading data for scoresaber user ${player.id}`);
        const response = await axios.get<string>(`https://scoresaber.com/u/${player.id}`);
        const html = response.data as string;

        const ul = cheerio('ul', html)[0];

        const rankingLi = cheerio(`strong:contains("Player Ranking:")`, ul).parent().slice(0, 1);
        const links = cheerio('a', rankingLi);

        const regionLink = links.slice(-1).attr('href');
        const region = regionLink.slice(-2);

        const anchors = cheerio('a', html);
        const globalRank = Number(anchors.slice(9, 10).text().slice(1).replace(',', ''));
        const regionalRank = Number(anchors.slice(10, 11).text().slice(2).replace(',', ''));

        const ppLi = cheerio(`strong:contains("Performance Points:")`, ul).parent().slice(0, 1);

        const pp = Number(ppLi.text().replace('pp', '').replace(/\s/g, '').replace('PerformancePoints:', '').replace(",", ""));
        const name = anchors.slice(8, 9).text().trim();

        return {
            regionalRank,
            region,
            globalRank,
            pp,
            name
        }
    }

    public static async getDetailsForID(id: string): Promise<PlayerData> {
        const player = new ScoreSaberUserRecord();
        player.id = id;
        return PlayerScraper.getDetailsForPlayer(player);
    }

    public static async getDetailsForLeaderboardPosition(position: number, region: string = null): Promise<PlayerData> {
        logger.debug(`[PlayerScraper::pos] Looking up id for user in leaderboard pos ${position} in ${region || 'global'} leaderboard`);

        let pageNum = Math.ceil(position / 50);

        let response = await axios.get<string>(`https://scoresaber.com/global/${pageNum}/${region ? `?country=${region}`: ''}`);

        let html = response.data;
        let rows = cheerio('tr', html);

        let row = position % 50 == 0 ? 50 : position % 50;

        if(rows.length <= row)
            throw Error("Invalid position (< 0 or > total player count?)");

        const url = cheerio('a', rows[row]).attr("href");

        const id = url.replace("/u/", "");

        return PlayerScraper.getDetailsForID(id);
    }
}
