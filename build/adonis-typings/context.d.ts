/// <reference types="@adonisjs/logger/build/adonis-typings/logger" />
declare module '@ioc:Adonis/Addons/NatsContext' {
    import type { LoggerContract } from '@ioc:Adonis/Core/Logger';
    import type { NatsRequestContract } from '@ioc:Adonis/Addons/NatsRequest';
    import type { NatsResponseContract } from '@ioc:Adonis/Addons/NatsResponse';
    import type { ConfigContract } from '@ioc:Adonis/Addons/NatsBroker';
    import type { NatsMessageContract } from '@ioc:Adonis/Addons/NatsJetStream';
    export interface NatsContextContract {
        /**
         * A helper to see top level properties on the context object
         */
        config: ConfigContract;
        request: NatsRequestContract;
        response: NatsResponseContract;
        logger: LoggerContract;
        params: Record<string, any>;
        routeKey: string;
        /**
         * JetStream acknowledgement controls. Present only while handling a
         * JetStream consumer delivery (absent for core request/reply routes).
         */
        message?: NatsMessageContract;
    }
    /**
     * Shape of the constructor. We export the constructor and not
     * the context instance, since that is passed to the NATS
     * lifecycle
     */
    const NatsContext: NatsContextContract;
    export default NatsContext;
}
