/*
 * adonis5-nats-broker
 *
 * (c) Dev.zarghami https://github.com/devzarghami
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Kvm } from '@nats-io/kv'
import type { KV, KvOptions, KvStatus } from '@nats-io/kv'
import type { Lister } from '@nats-io/jetstream'
import type { NatsKVContract } from '@ioc:Adonis/Addons/NatsKV'
import type Connection from './Connection'

/**
 * JetStream Key-Value manager. `bucket(name)` returns a v3 `KV` instance whose
 * own API (`put`, `get`, `watch`, `delete`, `keys`, ...) is exposed directly —
 * entries provide `string()`/`json()` convenience. Opened buckets are cached so
 * repeated lookups reuse the same handle on the shared connection.
 */
export default class KeyValue implements NatsKVContract {
  private kvm?: Kvm
  private readonly buckets = new Map<string, Promise<KV>>()

  constructor(private connection: Connection) {}

  private async manager(): Promise<Kvm> {
    if (this.kvm) return this.kvm
    const nc = await this.connection.use()
    this.kvm = new Kvm(nc)
    return this.kvm
  }

  /**
   * Open (creating if needed) a KV bucket. The returned `KV` is cached per name.
   */
  public bucket(name: string, opts?: Partial<KvOptions>): Promise<KV> {
    let existing = this.buckets.get(name)
    if (!existing) {
      existing = this.manager().then((kvm) => kvm.create(name, opts))
      this.buckets.set(name, existing)
    }
    return existing
  }

  /**
   * List the status of all KV buckets on the server.
   */
  public async list(): Promise<Lister<KvStatus>> {
    const kvm = await this.manager()
    return kvm.list()
  }
}
