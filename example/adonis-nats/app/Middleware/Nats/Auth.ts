import type { NatsContextContract } from '@ioc:Adonis/Addons/NatsContext'

export default class Auth {
  /**
   * Runs before the controller. Reject the request when there is no
   * `authorization` header, otherwise bind a user onto the request and continue.
   * The optional `guards` come from the route, e.g. `.middleware('auth:web')`.
   */
  public async handle(
    { request, response }: NatsContextContract,
    next: () => Promise<void>,
    guards?: string[]
  ) {
    const token = request.header('authorization')
    if (!token) {
      return response.unauthorized({ message: 'authorization header is required' })
    }

    // Pretend to resolve a user from the token; make it available downstream.
    request.set('user', { id: 1, name: 'Jon', guards: guards ?? [] })

    await next()
  }
}
