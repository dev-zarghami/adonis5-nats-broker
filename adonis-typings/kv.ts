/*
 * adonis5-nats-broker
 *
 * (c) Dev.zarghami https://github.com/devzarghami
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

declare module '@ioc:Adonis/Addons/NatsKV' {
  import type { KV as KvBucket, KvOptions, KvStatus } from '@nats-io/kv'
  import type { Lister } from '@nats-io/jetstream'

  export interface NatsKVContract {
    /**
     * Open (creating if needed) a KV bucket. The returned bucket exposes the
     * full v3 `KV` API: `put`, `get`, `watch`, `delete`, `keys`, `history`, etc.
     * Entries provide `string()`/`json()` helpers. Buckets are cached per name.
     */
    bucket(name: string, opts?: Partial<KvOptions>): Promise<KvBucket>

    /**
     * List the status of all KV buckets on the server.
     */
    list(): Promise<Lister<KvStatus>>
  }

  const KV: NatsKVContract
  export default KV
}
