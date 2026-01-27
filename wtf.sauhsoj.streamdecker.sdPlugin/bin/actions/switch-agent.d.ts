import { DidReceiveSettingsEvent, KeyDownEvent, SingletonAction } from "@elgato/streamdeck";
export declare class SwitchAgentAction extends SingletonAction {
    onKeyDown(ev: KeyDownEvent): Promise<void>;
    onDidReceiveSettings(ev: DidReceiveSettingsEvent): Promise<void>;
}
