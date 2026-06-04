import { Exception } from '@adonisjs/core/build/standalone'
import type { NatsContextContract } from '@ioc:Adonis/Addons/NatsContext'

/*
|--------------------------------------------------------------------------
| UserNotFoundException
|--------------------------------------------------------------------------
| A custom exception that self-handles: when raised it writes a 404 response
| itself, so the global handler does not need a special case for it.
|
| Raise it as:  throw new UserNotFoundException('User not found', 404, 'E_USER_NOT_FOUND')
*/
export default class UserNotFoundException extends Exception {
  public async handle(error: this, ctx: NatsContextContract) {
    ctx.response.status(error.status).send({
      code: error.code,
      message: error.message,
    })
  }
}
