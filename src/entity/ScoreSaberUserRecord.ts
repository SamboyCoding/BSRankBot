import {Entity, PrimaryColumn, BaseEntity, OneToOne, Column, JoinColumn} from 'typeorm';
import DiscordUserRecord from './DiscordUserRecord';

@Entity()
export default class ScoreSaberUserRecord extends BaseEntity {

    /**
     * Scoresaber user ID
     */
    @PrimaryColumn()
    id: string;

    @OneToOne(type => DiscordUserRecord)
    @JoinColumn()
    public discordUser: DiscordUserRecord;
}
