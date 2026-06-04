"use strict";
/*
 * adonis5-nats-broker
 *
 * (c) Dev.zarghami https://github.com/devzarghami
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const standalone_1 = require("@adonisjs/core/build/standalone");
class MakeController extends standalone_1.BaseCommand {
    /**
     * Run command
     */
    async run() {
        const stub = (0, path_1.join)(__dirname, '..', 'templates', 'controller.txt');
        this.name = this.name.replace(/Nats$/g, '');
        this.name = this.name.replace(this.name.charAt(0), this.name.charAt(0).toUpperCase());
        this.generator
            .addFile(this.name, {
            suffix: 'Controller',
            pattern: 'pascalcase',
            form: 'plural',
        })
            .stub(stub)
            .destinationDir('app/Controllers/Nats')
            .useMustache()
            .appRoot(this.application.cliCwd || this.application.appRoot)
            .apply({ model: this.name });
        await this.generator.run();
    }
}
MakeController.commandName = 'make:nats:controller';
MakeController.description = 'Make a new Nats controller';
exports.default = MakeController;
__decorate([
    standalone_1.args.string({ description: 'Name of the nats controller' }),
    __metadata("design:type", String)
], MakeController.prototype, "name", void 0);
