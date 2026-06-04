declare module '@ioc:Adonis/Addons/NatsRequest' {
    export interface NatsRequestContract {
        /**
         * Update the request body with new data object. The `all` property
         * will be re-computed by merging the query string and request
         * body.
         */
        updateBody(body: Record<string, any>): void;
        /**
         * Update route params
         */
        updateParams(body: Record<string, any>): void;
        /**
         * Update the query string with the new data object. The `all` property
         * will be re-computed by merging the query and the request body.
         */
        updateQs(data: Record<string, any>): void;
        /**
         * bind value to context
         */
        set(key: string, value: any): void;
        /**
         * get bind value from context
         */
        get(key: string): any;
        /**
         * Returns route params
         */
        params(): Record<string, any>;
        /**
         * Returns the request id from the `x-request-id` header. The
         * header is untoched, if it already exists.
         */
        id(): string | undefined;
        /**
         * Returns the query string object by reference
         */
        qs(): Record<string, any>;
        /**
         * Returns the request body object by reference
         */
        body(): Record<string, any>;
        /**
         * Returns reference to the merged copy of request body
         * and query string
         */
        all(): Record<string, any>;
        /**
         * Returns value for a given key from the request body or query string.
         * The `defaultValue` is used when original value is `undefined`.
         *
         * @example
         * ```js
         * request.input('username')
         *
         * // with default value
         * request.input('username', 'virk')
         * ```
         */
        input(key: string, defaultValue?: any): any;
        /**
         * Returns value for a given key from route params
         *
         * @example
         * ```js
         * request.param('id')
         *
         * // with default value
         * request.param('id', 1)
         * ```
         */
        param(key: string, defaultValue?: any): any;
        /**
         * Returns a copy of headers as an object
         */
        headers(): object;
        /**
         * Returns value for a given header key. The default value is
         * used when original value is `undefined`.
         */
        header(key: string): string | undefined;
        header<T>(key: string, defaultValue?: T): string | T;
    }
    export interface NatsRequestOptions {
        qs?: object;
        headers?: object;
        timeout?: number;
        servers?: string;
    }
    export interface NatsRequestResponse {
        headers: {
            status: number;
        } & Record<string, any>;
        body: any;
        request: {
            servers: string | string[] | undefined;
            timeout: number;
            payload: object;
            headers: object;
            name: string;
            url: string;
        };
    }
    /**
     * Shape of request constructor, we export the constructor for others to
     * add macros to the request class. Since, the instance is passed
     * to the http request cycle
     */
    const Request: NatsRequestContract;
    export default Request;
}
