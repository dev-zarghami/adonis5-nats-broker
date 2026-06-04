/// <reference types="@adonisjs/application/build/adonis-typings" />
import type { ApplicationContract } from '@ioc:Adonis/Core/Application';
export default class NatsProvider {
    protected app: ApplicationContract;
    static needsApplication: boolean;
    private config;
    private connection;
    private broker;
    private jetstream;
    private kv;
    private objectStore;
    private stream;
    private shouldConnect;
    constructor(app: ApplicationContract);
    register(): void;
    boot(): Promise<void>;
    ready(): Promise<void>;
    shutdown(): Promise<void>;
}
