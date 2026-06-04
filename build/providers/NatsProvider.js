"use strict";
/*
 * adonis5-nats-broker
 *
 * (c) Dev.zarghami https://github.com/devzarghami
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Config_1 = __importDefault(require("../src/Config"));
const Connection_1 = __importDefault(require("../src/Connection"));
const Dispatcher_1 = __importDefault(require("../src/Dispatcher"));
const Router_1 = __importDefault(require("../src/Router"));
const Client_1 = __importDefault(require("../src/Client"));
const Broker_1 = __importDefault(require("../src/Broker"));
const JetStream_1 = __importDefault(require("../src/JetStream"));
const KV_1 = __importDefault(require("../src/KV"));
const ObjectStore_1 = __importDefault(require("../src/ObjectStore"));
const Stream_1 = __importDefault(require("../src/Stream"));
const ExceptionHandler_1 = __importDefault(require("../src/ExceptionHandler"));
const test_1 = require("../src/test");
class NatsProvider {
    constructor(app) {
        this.app = app;
        this.config = Config_1.default;
        this.shouldConnect = false;
    }
    register() {
        this.app.container.singleton('Adonis/Addons/NatsBroker', () => this.broker);
        this.app.container.singleton('Adonis/Addons/NatsJetStream', () => this.jetstream);
        this.app.container.singleton('Adonis/Addons/NatsKV', () => this.kv);
        this.app.container.singleton('Adonis/Addons/NatsObjectStore', () => this.objectStore);
        this.app.container.singleton('Adonis/Addons/NatsStream', () => this.stream);
        this.app.container.singleton('Adonis/Addons/NatsExceptionHandler', () => ExceptionHandler_1.default);
        this.app.container.singleton('Adonis/Addons/NatsTest', () => ({ natsClient: test_1.natsClient }));
    }
    async boot() {
        const event = this.app.container.use('Adonis/Core/Event');
        const logger = this.app.container.use('Adonis/Core/Logger');
        const server = this.app.container.use('Adonis/Core/Server');
        // Merge the published default config with the app's `config/nats.ts`.
        this.config = Object.assign({}, Config_1.default, this.app.container.use('Adonis/Core/Config').get('nats'));
        // Wire the modules with explicit dependencies (no private-field hacks).
        this.connection = new Connection_1.default(this.config, event, logger);
        const dispatcher = new Dispatcher_1.default(this.app, server, logger, this.config);
        const router = new Router_1.default(this.app, server, logger, this.config, this.connection, dispatcher);
        const client = new Client_1.default(this.app, this.config, this.connection);
        this.broker = new Broker_1.default(this.connection, router, client);
        this.jetstream = new JetStream_1.default(this.app, server, logger, this.config, this.connection, dispatcher);
        this.kv = new KV_1.default(this.connection);
        this.objectStore = new ObjectStore_1.default(this.connection);
        this.stream = new Stream_1.default(this.config, this.jetstream, this.kv, this.objectStore, logger);
        // Only open the connection + start consuming when running as a server/test
        // process. KV/Object/JetStream-publish still connect lazily on first use
        // from any process (e.g. an HTTP handler).
        this.shouldConnect =
            process.argv.length >= 2
                ? this.config.runModes.map((mode) => process.argv[1].endsWith(mode)).includes(true)
                : false;
    }
    async ready() {
        if (!this.shouldConnect)
            return;
        await this.broker.createConnection();
        await this.jetstream.start();
    }
    async shutdown() {
        if (this.connection && this.connection.isConnected()) {
            await this.connection.close();
        }
    }
}
NatsProvider.needsApplication = true;
exports.default = NatsProvider;
