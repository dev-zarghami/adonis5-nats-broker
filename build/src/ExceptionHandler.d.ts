/// <reference types="@adonisjs/logger/build/adonis-typings/logger" />
import { NatsContextContract } from '@ioc:Adonis/Addons/NatsContext';
import { LoggerContract } from '@ioc:Adonis/Core/Logger';
export default class NatsExceptionHandler {
    logger: LoggerContract;
    /**
     * An array of error codes that must not be reported
     */
    ignoreCodes: string[];
    /**
     * An array of http statuses that must not be reported. The first
     * level of filtration is on the basis of statuses and then
     * the error codes.
     */
    ignoreStatuses: number[];
    /**
     * An array of internal error codes to ignore
     * from the reporting list
     */
    internalIgnoreCodes: string[];
    /**
     * Map of status pages to render, instead of making the
     * regular response
     */
    statusPages: {
        [key: string]: string;
    };
    constructor(logger: LoggerContract);
    /**
     * A custom context to send to the logger when reporting
     * errors.
     */
    context(ctx: NatsContextContract): any;
    /**
     * Returns a boolean telling if a given error is supposed
     * to be logged or not
     */
    shouldReport(error: any): boolean;
    /**
     * Makes the JSON response, based upon the environment in
     * which the app is runing
     */
    makeJSONResponse(error: any, ctx: NatsContextContract): Promise<void>;
    /**
     * Report a given error
     */
    report(error: any, ctx: NatsContextContract): void;
    /**
     * Handle exception and make response
     */
    handle(error: any, ctx: NatsContextContract): Promise<any>;
}
