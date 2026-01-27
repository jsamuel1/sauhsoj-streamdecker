import { KeyDownEvent, SingletonAction } from "@elgato/streamdeck";
export declare class SendThinkingAction extends SingletonAction {
    onKeyDown(ev: KeyDownEvent): Promise<void>;
}
