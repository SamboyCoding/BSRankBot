import PingCommand from './PingCommand';
import BaseCommand from './BaseCommand';
import AddMeCommand from './AddMeCommand';

class Commands {
    static commands: BaseCommand[] = [
        new AddMeCommand(),
        new PingCommand()
    ]
}

export default Commands.commands as BaseCommand[];
