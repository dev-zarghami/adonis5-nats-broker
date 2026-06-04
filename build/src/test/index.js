"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.natsClient = void 0;
const ResponseAssert_1 = __importDefault(require("./ResponseAssert"));
const natsClient = (Broker) => {
    //@ts-ignore
    return async function (config, runner, { TestContext }) {
        TestContext.getter('broker', () => ({
            request: async (pattern, payload, options) => {
                try {
                    let response = await Broker.request(pattern, payload, options);
                    return new ResponseAssert_1.default(response);
                }
                catch (e) {
                    return new ResponseAssert_1.default(e);
                }
            },
        }), true);
    };
};
exports.natsClient = natsClient;
