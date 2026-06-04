/// <reference types="@adonisjs/validator" />
import { TypedSchema, ParsedTypedSchema } from '@ioc:Adonis/Core/Validator';
declare module '@ioc:Adonis/Addons/NatsRequest' {
    interface NatsRequestContract {
        /**
         * Validate current request. The data is optional here, since request
         * can pre-fill it for us
         */
        validate<T extends ParsedTypedSchema<TypedSchema>>(validator: Function | Object): Promise<T['props']>;
    }
}
