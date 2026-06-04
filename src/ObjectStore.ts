/*
 * adonis5-nats-broker
 *
 * (c) Dev.zarghami https://github.com/devzarghami
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { ReadableStream } from 'node:stream/web'
import { Objm } from '@nats-io/obj'
import type { ObjectInfo, ObjectStore, ObjectStoreOptions, ObjectStoreStatus } from '@nats-io/obj'
import type { Lister } from '@nats-io/jetstream'
import type { NatsObjectStoreContract } from '@ioc:Adonis/Addons/NatsObjectStore'
import type Connection from './Connection'

/**
 * Turn a byte buffer or string into a single-chunk ReadableStream, which is the
 * shape v3's ObjectStore `put` expects.
 */
function readableFrom(data: Uint8Array | string): ReadableStream<Uint8Array> {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(bytes)
      controller.close()
    },
  })
}

/**
 * Drain a ReadableStream fully into a single Uint8Array.
 */
async function readAll(rs: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  const reader = rs.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    total += value.length
  }
  const out = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    out.set(chunk, offset)
    offset += chunk.length
  }
  return out
}

/**
 * JetStream Object Store manager. `bucket(name)` returns a v3 `ObjectStore`
 * (whose native API takes/returns ReadableStreams), and `putBlob`/`getBlob`
 * provide buffer-based convenience for the common small-object case. Opened
 * buckets are cached on the shared connection.
 */
export default class ObjectStoreManager implements NatsObjectStoreContract {
  private objm?: Objm
  private readonly buckets = new Map<string, Promise<ObjectStore>>()

  constructor(private connection: Connection) {}

  private async manager(): Promise<Objm> {
    if (this.objm) return this.objm
    const nc = await this.connection.use()
    this.objm = new Objm(nc)
    return this.objm
  }

  /**
   * Open (creating if needed) an Object Store bucket, cached per name.
   */
  public bucket(name: string, opts?: Partial<ObjectStoreOptions>): Promise<ObjectStore> {
    let existing = this.buckets.get(name)
    if (!existing) {
      existing = this.manager().then((objm) => objm.create(name, opts))
      this.buckets.set(name, existing)
    }
    return existing
  }

  /**
   * Store a buffer/string as a named object and return its info.
   */
  public async putBlob(
    bucket: string,
    name: string,
    data: Uint8Array | string,
    meta: { description?: string } = {}
  ): Promise<ObjectInfo> {
    const store = await this.bucket(bucket)
    return store.put({ name, ...meta }, readableFrom(data) as any)
  }

  /**
   * Retrieve a named object as a single buffer, or null if it does not exist.
   */
  public async getBlob(bucket: string, name: string): Promise<Uint8Array | null> {
    const store = await this.bucket(bucket)
    const result = await store.get(name)
    if (!result) return null
    return readAll(result.data as any)
  }

  /**
   * List the status of all Object Store buckets on the server.
   */
  public async list(): Promise<Lister<ObjectStoreStatus>> {
    const objm = await this.manager()
    return objm.list()
  }
}
