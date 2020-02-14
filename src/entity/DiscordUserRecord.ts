import {Entity, PrimaryColumn, BaseEntity, OneToOne, Column, JoinColumn} from 'typeorm';
import ScoreSaberUserRecord from './ScoreSaberUserRecord';
import Bot from '../Bot';
import BSRankBot from '../Bot';
import {User} from 'discord.js';

@Entity()
export default class DiscordUserRecord extends BaseEntity {

    /**
     * Discord user ID
     */
    @PrimaryColumn()
    public id: string;

    @OneToOne(type => ScoreSaberUserRecord, {
        eager: true
    })
    @JoinColumn()
    public scoreSaberProfile: ScoreSaberUserRecord;

    get fetchDiscordUser(): Promise<User> {
        return BSRankBot.discordClient.fetchUser(this.id);
    }
}
