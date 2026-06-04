/*
 * adonis5-nats-broker
 *
 * (c) Dev.zarghami https://github.com/devzarghami
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { LoggerContract } from '@ioc:Adonis/Core/Logger'
import type { ConfigContract } from '@ioc:Adonis/Addons/NatsBroker'
import type JetStream from './JetStream'
import type KeyValue from './KV'
import type ObjectStoreManager from './ObjectStore'

/**
 * One applied change in a sync run.
 */
export interface SyncEntry {
  kind: 'stream' | 'consumer' | 'kv' | 'objectStore'
  name: string
  action: 'created' | 'updated' | 'exists'
}

/**
 * Declaratively reconcile the JetStream streams/consumers, KV buckets, and
 * Object Store buckets described in config with the server — idempotently.
 * Safe to run repeatedly (the `node ace nats:sync` command); a second run with
 * unchanged config reports everything as already present.
 */
export default class Stream {
  constructor(
    private config: ConfigContract,
    private jetstream: JetStream,
    private kv: KeyValue,
    private objectStore: ObjectStoreManager,
    private logger: LoggerContract
  ) {}

  public async sync(): Promise<SyncEntry[]> {
    const report: SyncEntry[] = []
    const jsm = await this.jetstream.manager()

    for (const stream of this.config.jetstream.streams || []) {
      try {
        await jsm.streams.info(stream.name)
        await jsm.streams.update(stream.name, stream as any)
        report.push({ kind: 'stream', name: stream.name, action: 'updated' })
      } catch {
        await jsm.streams.add(stream as any)
        report.push({ kind: 'stream', name: stream.name, action: 'created' })
      }
    }

    for (const consumer of this.config.jetstream.consumers || []) {
      const name = (consumer as any).durable_name || (consumer as any).name
      try {
        await jsm.consumers.info(consumer.stream, name)
        report.push({ kind: 'consumer', name, action: 'exists' })
      } catch {
        const { stream, ...cfg } = consumer as any
        await jsm.consumers.add(stream, cfg)
        report.push({ kind: 'consumer', name, action: 'created' })
      }
    }

    for (const bucket of this.config.kv.buckets || []) {
      await this.kv.bucket(bucket.name, bucket as any)
      report.push({ kind: 'kv', name: bucket.name, action: 'exists' })
    }

    for (const bucket of this.config.objectStore.buckets || []) {
      await this.objectStore.bucket(bucket.name, bucket as any)
      report.push({ kind: 'objectStore', name: bucket.name, action: 'exists' })
    }

    for (const entry of report) {
      this.logger.info(`[NATS] sync ${entry.kind} "${entry.name}" — ${entry.action}`)
    }
    return report
  }
}
