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
const standalone_1 = require("@adonisjs/core/build/standalone");
class NatsSync extends standalone_1.BaseCommand {
    async run() {
        const stream = this.application.container.use('Adonis/Addons/NatsStream');
        const broker = this.application.container.use('Adonis/Addons/NatsBroker');
        this.logger.info('Reconciling NATS resources from config...');
        try {
            const report = await stream.sync();
            if (!report.length) {
                this.logger.info('Nothing declared to sync.');
            }
            for (const entry of report) {
                if (entry.action === 'created') {
                    this.logger.action('create').succeeded(`${entry.kind} ${entry.name}`);
                }
                else if (entry.action === 'updated') {
                    this.logger.action('update').succeeded(`${entry.kind} ${entry.name}`);
                }
                else {
                    this.logger.action('skip').skipped(`${entry.kind} ${entry.name}`, 'already exists');
                }
            }
        }
        finally {
            await broker.closeConnection();
        }
    }
}
NatsSync.commandName = 'nats:sync';
NatsSync.description = 'Reconcile JetStream streams/consumers and KV/Object Store buckets from config';
NatsSync.settings = {
    loadApp: true,
    stayAlive: false,
};
exports.default = NatsSync;
