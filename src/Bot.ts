import "reflect-metadata";
import {Connection, createConnection} from 'typeorm';
import logger from './Logger';
import {Client, DMChannel, Message, TextChannel} from 'discord.js';
import commands from "./commands";
import TimedUpdater from './TimedUpdater';
import {serverId} from "../config.json";

export default class BSRankBot {
    public static readonly PREFIX = process.env.BOT_PREFIX || "%";

    public static connection: Connection;
    public static discordClient: Client;
}

function runUpdate(): void {
    TimedUpdater.updateForGuild(BSRankBot.discordClient.guilds.get(serverId))
        .catch((e) => logger.error(e.stack || e));
}

async function onReady(): Promise<void> {
    logger.info(`[Discord] Ready! Server count: ${BSRankBot.discordClient.guilds.size}. User Count: ${BSRankBot.discordClient.users.size}`);

    runUpdate();

    setInterval(runUpdate, 60 * 1000 * 10);
}

function onMessage(message: Message): void {
    if(!message.content.startsWith(BSRankBot.PREFIX)) return;

    const split = message.content.split(" ");
    const commandWord = split[0].replace(BSRankBot.PREFIX, "").toLowerCase();
    const command = commands.find(c => c.getName().toLowerCase() == commandWord);

    if(!command) return;

    if(message.channel instanceof DMChannel) {
        message.channel.send("This command must be run in a server.").catch(logger.error);
        return;
    }

    if(command.requiresAdmin() && (message.channel instanceof TextChannel && !message.member.hasPermission('ADMINISTRATOR'))) {
        message.channel.send("⛔ You can't do that! ⛔").catch(logger.error);
        return;
    }

    command.run(
        message,
        message.channel as (TextChannel | DMChannel),
        message.author,
        message.guild || null,
        message.member || null,
    ).catch(e => {
        logger.error("[Command] Exception thrown! " + (e.stack || e));
        message.channel.send("Uh oh! Something went wrong trying to execute that command!");
    });
}


logger.info("[Init] Connecting to database...");

createConnection().then(async connection => {
    logger.info("[Init] Connected to database.");
    BSRankBot.connection = connection;
    BSRankBot.discordClient = new Client();

    BSRankBot.discordClient.once('ready', onReady);
    BSRankBot.discordClient.on('message', onMessage);

    await BSRankBot.discordClient.login(process.env.DISCORD_TOKEN || "NO_TOKEN_PROVIDED"); //Don't catch, we want to crash

    logger.info("[Init] Connected to discord.");

}).catch(logger.error);
