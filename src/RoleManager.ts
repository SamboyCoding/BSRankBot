import {GuildMember} from 'discord.js';
import PlayerScraper from './scrapers/PlayerScraper';
import {regionRoles, regionPositionRoles, globalPositionRoles} from '../config.json'
import logger from './Logger';

export default class RoleManager {
    private static async addRoleWithName(user: GuildMember, roleName: string): Promise<void> {
        //Find a role with that name
        let role = user.guild.roles.find(r => r.name.toLowerCase() == roleName.toLowerCase());

        //Create role if missing
        if (!role) {
            logger.warn(`[RoleManager] Creating new role "${roleName}"`);
            role = await user.guild.createRole({name: roleName, permissions: []});
        }

        //Add role to user if missing
        if (!user.roles[role.id])
            await user.addRole(role);
    }

     private static async updatePositionalRoles(user: GuildMember, roleDict: {[key: string]: string}, lookupKey: "regionalRank" | "globalRank"): Promise<void> {
        const ssUserProfile = await PlayerScraper.getDetailsForDiscordUser(user);

        if (!ssUserProfile)
            return;

        //Convert keys of regionPositionRoles to numbers and sort in ascending order
        const boundaries = Object.keys(roleDict).map(Number).sort((a, b) => a - b);

        //Find the first boundary which the user is <= to.
        const boundaryRank = boundaries.find(b => ssUserProfile[lookupKey] <= b);

        //Lookup role name for this boundary
        const roleName = roleDict[boundaryRank] || null;

        //Remove all positional roles that this user doesn't deserve
        const undeservingRoles = Object.values(roleDict) //Get all role names
            .filter(r => r !== roleName) //Remove the one we're about to add
            .map(r => user.guild.roles.find(r2 => r2.name.toLowerCase() === r.toLowerCase())) //Look up the actual roles
            .filter(r => !!r && !!user.roles[r.id]); //Filter to those that exist and that the user has

        //Remove them
        await user.removeRoles(undeservingRoles);

        if(roleName)
            //Add the new one to the user
            await RoleManager.addRoleWithName(user, roleName);
    }

    public static async addRegionRoleToMember(user: GuildMember): Promise<void> {
        //Fetch user's scoresaber profile from their discord one.
        const ssUserProfile = await PlayerScraper.getDetailsForDiscordUser(user);

        if (!ssUserProfile)
            return;

        //Use their two-letter region id to look up a role name (or fall back to the default empty-key one)
        const regionRoleName: string = regionRoles[ssUserProfile.region.toLowerCase()] || regionRoles[''];

        //Add role to user
        await RoleManager.addRoleWithName(user, regionRoleName);
    }

    public static async updateGlobalPositionRole(user: GuildMember): Promise<void> {
        return this.updatePositionalRoles(user, globalPositionRoles, "globalRank");
    }

    public static async updateRegionalPositionRole(user: GuildMember): Promise<void> {
        return this.updatePositionalRoles(user, regionPositionRoles, "regionalRank");
    }

    private static async removeTheseRolesFromGuildMembersThatArent(usersNotToRemoveFrom: GuildMember[], roleNamesToRemove: string[]): Promise<void> {
        if(usersNotToRemoveFrom.length == 0) return;

        const guild = usersNotToRemoveFrom[0].guild;

        const goodSnowflakes = usersNotToRemoveFrom.map(u => u.id);

        const toRemoveFrom = guild.members.filter(
            u => goodSnowflakes.indexOf(u.id) < 0
        );

        const roles = roleNamesToRemove.map(name => guild.roles.find(role => role.name.toLowerCase() === name.toLowerCase()))
            .filter(r => !!r); //Look up the actual roles

        const hasUndeservedRole = toRemoveFrom.filter(
            u => !!u.roles.find( //For each role the user has...
                r => !!roles.find( //...Check that the roles list contains a role...
                    r2 => r2.id == r.id //...Such that they both have the same id
                )
            )
        );

        hasUndeservedRole.forEach(u => u.removeRoles(roles));
    }

    public static async removeAllUndeservedGlobalRoles(usersNotToRemoveFrom: GuildMember[]): Promise<void> {
        return this.removeTheseRolesFromGuildMembersThatArent(usersNotToRemoveFrom, Object.values(globalPositionRoles));
    }

    public static async removeAllUndeservedRegionalRoles(usersNotToRemoveFrom: GuildMember[]): Promise<void> {
        return this.removeTheseRolesFromGuildMembersThatArent(usersNotToRemoveFrom, Object.values(regionPositionRoles));
    }
}
