import { KeyDownEvent, SingletonAction } from "@elgato/streamdeck";
export declare class LaunchKiroCliAction extends SingletonAction {
    onKeyDown(ev: KeyDownEvent): Promise<void>;
}
