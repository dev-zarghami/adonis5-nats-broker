import { BaseCommand } from '@adonisjs/core/build/standalone';
export default class MakeListener extends BaseCommand {
    static commandName: string;
    static description: string;
    name: string;
    run(): Promise<void>;
}
