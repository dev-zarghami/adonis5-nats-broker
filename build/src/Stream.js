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
/**
 * Declaratively reconcile the JetStream streams/consumers, KV buckets, and
 * Object Store buckets described in config with the server — idempotently.
 * Safe to run repeatedly (the `node ace nats:sync` command); a second run with
 * unchanged config reports everything as already present.
 */
class Stream {
    constructor(config, jetstream, kv, objectStore, logger) {
        this.config = config;
        this.jetstream = jetstream;
        this.kv = kv;
        this.objectStore = objectStore;
        this.logger = logger;
    }
    async sync() {
        const report = [];
        const jsm = await this.jetstream.manager();
        for (const stream of this.config.jetstream.streams || []) {
            try {
                await jsm.streams.info(stream.name);
                await jsm.streams.update(stream.name, stream);
                report.push({ kind: 'stream', name: stream.name, action: 'updated' });
            }
            catch {
                await jsm.streams.add(stream);
                report.push({ kind: 'stream', name: stream.name, action: 'created' });
            }
        }
        for (const consumer of this.config.jetstream.consumers || []) {
            const name = consumer.durable_name || consumer.name;
            try {
                await jsm.consumers.info(consumer.stream, name);
                report.push({ kind: 'consumer', name, action: 'exists' });
            }
            catch {
                const { stream, ...cfg } = consumer;
                await jsm.consumers.add(stream, cfg);
                report.push({ kind: 'consumer', name, action: 'created' });
            }
        }
        for (const bucket of this.config.kv.buckets || []) {
            await this.kv.bucket(bucket.name, bucket);
            report.push({ kind: 'kv', name: bucket.name, action: 'exists' });
        }
        for (const bucket of this.config.objectStore.buckets || []) {
            await this.objectStore.bucket(bucket.name, bucket);
            report.push({ kind: 'objectStore', name: bucket.name, action: 'exists' });
        }
        for (const entry of report) {
            this.logger.info(`[NATS] sync ${entry.kind} "${entry.name}" — ${entry.action}`);
        }
        return report;
    }
}
exports.default = Stream;
