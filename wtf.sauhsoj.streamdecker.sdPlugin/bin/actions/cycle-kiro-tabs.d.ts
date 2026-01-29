import { KeyDownEvent, SingletonAction } from "@elgato/streamdeck";
export declare class CycleKiroTabsAction extends SingletonAction {
    onKeyDown(ev: KeyDownEvent): Promise<void>;
}
