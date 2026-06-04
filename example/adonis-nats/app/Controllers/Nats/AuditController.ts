import type { NatsContextContract } from '@ioc:Adonis/Addons/NatsContext'

/**
 * Target of a fire-and-forget core `Broker.publish('audit.log', ...)`. There is
 * no reply — the publisher does not wait — so this just records the event.
 */
export default class AuditController {
  public async record({ request, logger }: NatsContextContract) {
    logger.info({ event: request.body() }, '[publish] audit.log received')
  }
}
