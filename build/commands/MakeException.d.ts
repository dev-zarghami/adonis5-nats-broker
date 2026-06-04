import { BaseCommand } from '@adonisjs/core/build/standalone';
export default class MakeController extends BaseCommand {
    static commandName: string;
    static description: string;
    /**
     * The name of the model file.
     */
    name: string;
    /**
     * Run command
     */
    run(): Promise<void>;
}
