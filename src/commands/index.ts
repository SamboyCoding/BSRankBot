import PingCommand from './PingCommand';
import BaseCommand from './BaseCommand';
import AddMeCommand from './AddMeCommand';
import AddUserCommand from './AddUserCommand';
import AmCommand from './AmCommand';
import AmrCommand from './AmrCommand';
import PpDiffCommand from './PpDiffCommand';
import PpCommand from './PpCommand';

class Commands {
    static commands: BaseCommand[] = [
        new AddMeCommand(),
        new AddUserCommand(),
        new AmCommand(),
        new AmrCommand(),
        new PpDiffCommand(),
        new PpCommand(),
        new PingCommand()
    ]
}

export default Commands.commands as BaseCommand[];
