import WebSocket from "ws";
declare const OriginalWebSocket: any;
declare class PatchedWebSocket extends OriginalWebSocket {
    private _neoOnMessage;
    constructor(address: string | URL, protocols?: string | string[], options?: WebSocket.ClientOptions);
    set onmessage(handler: ((ev: WebSocket.MessageEvent) => void) | null);
    get onmessage(): ((ev: WebSocket.MessageEvent) => void) | null;
}
export { PatchedWebSocket };
