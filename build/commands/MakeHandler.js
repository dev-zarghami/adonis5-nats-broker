"use strict";
/*
 * adonis5-nats-broker
 *
 * (c) Dev.zarghami https://github.com/devzarghami
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const standalone_1 = require("@adonisjs/core/build/standalone");
class MakeController extends standalone_1.BaseCommand {
    /**
     * Run command
     */
    async run() {
        const stub = (0, path_1.join)(__dirname, '..', 'templates', 'handler.txt');
        const name = 'Handler';
        this.generator
            .addFile(name, {
            suffix: '',
            pattern: 'pascalcase',
            form: 'singular',
        })
            .stub(stub)
            .destinationDir('app/Exceptions/Nats')
            .useMustache()
            .appRoot(this.application.cliCwd || this.application.appRoot)
            .apply({ model: name });
        await this.generator.run();
    }
}
MakeController.commandName = 'init:nats:handler';
MakeController.description = 'Make Nats exception handler';
exports.default = MakeController;
