"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = require("@japa/assert");
class ResponseAssert {
    constructor(response, assert = new assert_1.Assert()) {
        this.response = response;
        this.assert = assert;
    }
    hasBody() {
        return !!this.response.body;
    }
    headers() {
        return this.response.headers;
    }
    header(key) {
        return this.response.headers[key];
    }
    body() {
        return this.response.body;
    }
    status() {
        return Number(this.response.headers.status);
    }
    assertStatus(expectedStatus) {
        this.assert.equal(this.status(), expectedStatus);
    }
    assertBody(expectedBody) {
        this.assert.deepEqual(this.body(), expectedBody);
    }
    assertBodyContains(expectedBody) {
        this.assert.containsSubset(this.body(), expectedBody);
    }
    assertHeader(name, value) {
        this.assert.property(this.headers(), name);
        if (value !== undefined) {
            this.assert.deepEqual(this.header(name), value);
        }
    }
}
exports.default = ResponseAssert;
