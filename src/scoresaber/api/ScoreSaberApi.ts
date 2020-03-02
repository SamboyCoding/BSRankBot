import axios, {AxiosResponse} from "axios";
import ScoreSaberApiUserListEntry from "./ScoreSaberApiUserListEntry";
import GlobalPlayerScraper from "../scrapers/GlobalPlayerScraper";
import ScoreSaberApiUser from "./ScoreSaberApiUser";

export default class ScoreSaberApi {
    private static readonly SS_BASE_URL = "https://new.scoresaber.com/api/";

    private static async fetchApiPage(relativePath: string): Promise<AxiosResponse<object>> {
        return axios.get(this.SS_BASE_URL + relativePath);
    }

    public static async ListGlobalPlayers(): Promise<ScoreSaberApiUserListEntry[]> {
        const ret: ScoreSaberApiUserListEntry[] = [];
        for (let i = 0; i < GlobalPlayerScraper.numPagesToScrape; i++) {
            const req = await this.fetchApiPage(`players/${i}`);
            const list = req.data as ScoreSaberApiUserListEntry[];
            ret.concat(list);
        }
        return ret;
    }

    public static async GetPlayerInfo(id: string): Promise<ScoreSaberApiUser> {
        //We only need basic. Annoyingly the list entry doesn't have country rank or we wouldn't need this at all ;-;
        const req = await this.fetchApiPage(`player/${id}/basic`);
        return req.data as ScoreSaberApiUser;
    }
}