import ScoreSaberUserRecord from '../../entity/ScoreSaberUserRecord';
import axios from 'axios';
import * as cheerio from 'cheerio';
import logger from '../../Logger';

export default class GlobalPlayerScraper {
    public static numPagesToScrape = 4;

    /**
     * Loads the first {numPagesToScrape} pages from the scoresaber api. For the default player count of 550, this takes about 8 seconds.
     */
    public static async getPlayerList(): Promise<ScoreSaberUserRecord[]> {
        //not saved
        const players: ScoreSaberUserRecord[] = [];

        for (let pageNumber = 0; pageNumber < GlobalPlayerScraper.numPagesToScrape; pageNumber++) {
            logger.debug(`[GlobalScraper::list] Loading page ${pageNumber}`);
            try {
                const response = await axios.get<string>(`https://scoresaber.com/global/${pageNumber + 1}`);

                const rows = cheerio('tr', response.data);
                rows.each((playerNum, elem) => {
                    if (playerNum !== 0) {
                        const ssUrl = cheerio('a', elem).attr('href');

                        const id = ssUrl.replace('/u/', '');

                        const player = new ScoreSaberUserRecord();
                        player.id = id;

                        players[50 * pageNumber + playerNum - 1] = player;
                    }
                });
            } catch (e) {
                logger.error('[GlobalScraper::list] Failed Page fetch! ' + e);
            }
        }

        return players;
    }
}
