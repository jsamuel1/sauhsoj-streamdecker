import { DidReceiveSettingsEvent, KeyDownEvent, SingletonAction, WillAppearEvent } from "@elgato/streamdeck";
export declare class LaunchTargetAction extends SingletonAction {
    onWillAppear(ev: WillAppearEvent): Promise<void>;
    onDidReceiveSettings(ev: DidReceiveSettingsEvent): Promise<void>;
    onKeyDown(ev: KeyDownEvent): Promise<void>;
    private applyImage;
}
