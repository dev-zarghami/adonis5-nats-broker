import { Assert } from '@japa/assert';
export default class ResponseAssert {
    protected response: any;
    protected assert: Assert;
    constructor(response: any, assert?: Assert);
    hasBody(): boolean;
    headers(): any;
    header(key: any): any;
    body(): any;
    status(): number;
    assertStatus(expectedStatus: number): void;
    assertBody(expectedBody: any): void;
    assertBodyContains(expectedBody: any): void;
    assertHeader(name: string, value?: any): void;
}
