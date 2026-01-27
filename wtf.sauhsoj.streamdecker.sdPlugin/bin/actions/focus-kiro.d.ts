import { KeyDownEvent, SingletonAction } from "@elgato/streamdeck";
export declare class FocusKiroAction extends SingletonAction {
    onKeyDown(ev: KeyDownEvent): Promise<void>;
}
