import "reflect-metadata";
import {Connection, createConnection} from 'typeorm';
import logger from './Logger';
import {Client, DMChannel, Message, TextChannel} from 'discord.js';
import commands from "./commands";

export default class BSRankBot {
    public static readonly PREFIX = process.env.BOT_PREFIX || "%";

    public static connection: Connection;
    public static discordClient: Client;
}

async function onReady() {
    logger.info(`[Discord] Ready! Server count: ${BSRankBot.discordClient.guilds.size}. User Count: ${BSRankBot.discordClient.users.size}`);
}

logger.info("[Init] Connecting to database...");

function onMessage(message: Message) {
    if(!message.content.startsWith(BSRankBot.PREFIX)) return;

    const split = message.content.split(" ");
    const commandWord = split[0].replace(BSRankBot.PREFIX, "").toLowerCase();
    const command = commands.find(c => c.getName().toLowerCase() == commandWord);

    if(!command) return;

    if(message.channel instanceof DMChannel)
        return message.channel.send("This command must be run in a server.");

    if(command.requiresAdmin() && (message.channel instanceof TextChannel && !message.member.hasPermission('ADMINISTRATOR')))
        return message.channel.send("⛔ You can't do that! ⛔");

    command.run(
        message,
        message.channel as (TextChannel | DMChannel),
        message.author,
        (message instanceof TextChannel ? message.guild : null),
        (message instanceof TextChannel ? message.member : null)
    ).catch(e => {
        logger.error("[Command] Exception thrown! " + e);
    });
}

createConnection().then(async connection => {
    logger.info("[Init] Connected to database.");
    BSRankBot.connection = connection;
    BSRankBot.discordClient = new Client();

    BSRankBot.discordClient.on('ready', onReady);
    BSRankBot.discordClient.on('message', onMessage);

    await BSRankBot.discordClient.login(process.env.DISCORD_TOKEN || "NO_TOKEN_PROVIDED"); //Don't catch, we want to crash


    logger.info("[Init] Connected to discord.");

}).catch(error => logger.error(error));
