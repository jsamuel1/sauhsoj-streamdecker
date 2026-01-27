import { KeyDownEvent, SingletonAction } from "@elgato/streamdeck";
export declare class SendNoAction extends SingletonAction {
    onKeyDown(ev: KeyDownEvent): Promise<void>;
}
