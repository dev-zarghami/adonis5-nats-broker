declare module '@ioc:Adonis/Addons/NatsTest' {
    interface NatsTestResponseAssert {
        hasBody(): boolean;
        headers(): object;
        header(key: string): any;
        body(): object;
        status(): number;
        assertStatus(expectedStatus: number): void;
        assertBody(expectedBody: any): void;
        assertBodyContains(expectedBody: any): void;
        assertHeader(name: string, value?: any): void;
    }
}
