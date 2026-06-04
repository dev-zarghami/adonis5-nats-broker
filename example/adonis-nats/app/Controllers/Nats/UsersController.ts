import type { NatsContextContract } from '@ioc:Adonis/Addons/NatsContext'
import { schema } from '@ioc:Adonis/Core/Validator'
import UserNotFoundException from 'App/Exceptions/Nats/UserNotFoundException'

const users = [
  { id: 1, name: 'Jon' },
  { id: 2, name: 'Jane' },
]

export default class UsersController {
  /**
   * Subject `v1.get.users` — request/reply.
   */
  public async index({ response }: NatsContextContract) {
    return response.ok(users)
  }

  /**
   * Subject `v1.get.users.{id}` — route param + a self-handling custom
   * exception when the user does not exist.
   */
  public async show({ request, response }: NatsContextContract) {
    const id = Number(request.param('id'))
    const user = users.find((u) => u.id === id)
    if (!user) {
      throw new UserNotFoundException(`User ${id} not found`, 404, 'E_USER_NOT_FOUND')
    }
    return response.ok(user)
  }

  /**
   * Subject `v1.post.users` — body validation (a failure is turned into a 422
   * by the global exception handler).
   */
  public async store({ request, response }: NatsContextContract) {
    const payload = (await request.validate({
      schema: schema.create({ name: schema.string() }),
    })) as { name: string }
    const user = { id: users.length + 1, name: payload.name }
    users.push(user)
    return response.created({ message: 'User created', data: user })
  }

  /**
   * JetStream listener for `users.created` — auto-acked on return. Use
   * ctx.message for manual ack / nak / term / working.
   */
  public async onCreated({ request, message, logger }: NatsContextContract) {
    logger.info({ user: request.body() }, '[jetstream] users.created received')
    message?.ack()
  }
}
