import Logger from '@ioc:Adonis/Core/Logger'
import NatsExceptionHandler from '@ioc:Adonis/Addons/NatsExceptionHandler'
import type {NatsContextContract} from '@ioc:Adonis/Addons/NatsContext'

export default class ExceptionHandler extends NatsExceptionHandler {
  constructor() {
    super(Logger)
  }

  public async handle(error: any, ctx: NatsContextContract) {
    return super.handle(error, ctx)
  }
}
