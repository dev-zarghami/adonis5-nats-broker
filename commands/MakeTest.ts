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

export default class MakeTest extends BaseCommand {
  public static commandName = 'make:nats:test'
  public static description = 'Make a new Nats test'

  @args.string({ description: 'Name of the nats test' })
  public name: string

  public async run(): Promise<void> {
    const stub = join(__dirname, '..', 'templates', 'test.txt')

    this.name = this.name.replace(/Nats$/g, '')
    this.name = this.name.replace(this.name.charAt(0), this.name.charAt(0).toUpperCase())

    this.generator
      .addFile(this.name, {
        suffix: '',
        pattern: 'pascalcase',
        form: 'singular',
        extname: '.spec.ts',
      })
      .stub(stub)
      .destinationDir('tests/functional/nats')
      .useMustache()
      .appRoot(this.application.cliCwd || this.application.appRoot)
      .apply({ model: this.name })

    await this.generator.run()
  }
}
