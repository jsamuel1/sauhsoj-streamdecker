import { KeyDownEvent, SingletonAction } from "@elgato/streamdeck";
export declare class CycleKiroTabsAction extends SingletonAction {
    onKeyDown(_ev: KeyDownEvent): Promise<void>;
}
