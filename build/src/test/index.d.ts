import { NatsTestResponseAssert } from '@ioc:Adonis/Addons/NatsTest';
import { NatsBrokerContract } from '@ioc:Adonis/Addons/NatsBroker';
declare module '@japa/runner' {
    interface TestContext {
        broker: {
            request(pattern: string, payload?: object, options?: {
                headers?: object;
                qs?: object;
            }): Promise<NatsTestResponseAssert>;
        };
    }
}
export declare const natsClient: (Broker: NatsBrokerContract) => (config: any, runner: any, { TestContext }: any) => Promise<void>;
