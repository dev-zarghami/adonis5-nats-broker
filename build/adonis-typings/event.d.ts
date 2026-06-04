declare module '@ioc:Adonis/Core/Event' {
    import type { NatsConnection } from '@nats-io/nats-core';
    interface EventsList {
        'nats:connect': {
            connection: NatsConnection | Error;
        };
        'nats:reconnect': {
            connection: NatsConnection;
        };
        'nats:disconnect': {
            connection: NatsConnection;
        };
        'nats:closed': {
            error: any;
            connection: NatsConnection;
        };
        'nats:error': {
            error: any;
            connection: NatsConnection | Error;
        };
    }
}
