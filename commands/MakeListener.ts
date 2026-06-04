/*
 * adonis5-nats-broker
 *
 * (c) Dev.zarghami https://github.com/devzarghami
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { join } from 'path'
import { BaseCommand, args } from '@adonisjs/core/build/standalone'

export default class MakeListener extends BaseCommand {
  public static commandName = 'make:nats:listener'
  public static description = 'Make a new JetStream listener (consumer controller)'

  @args.string({ description: 'Name of the nats listener' })
  public name: string

  public async run(): Promise<void> {
    const stub = join(__dirname, '..', 'templates', 'listener.txt')

    this.name = this.name.replace(/Nats$/g, '')
    this.name = this.name.replace(this.name.charAt(0), this.name.charAt(0).toUpperCase())

    this.generator
      .addFile(this.name, {
        suffix: 'Listener',
        pattern: 'pascalcase',
        form: 'singular',
      })
      .stub(stub)
      .destinationDir('app/Controllers/Nats')
      .useMustache()
      .appRoot(this.application.cliCwd || this.application.appRoot)
      .apply({ model: this.name })

    await this.generator.run()
  }
}
