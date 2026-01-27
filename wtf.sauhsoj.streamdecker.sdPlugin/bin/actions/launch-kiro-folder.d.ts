import { DidReceiveSettingsEvent, KeyDownEvent, SingletonAction, WillAppearEvent } from "@elgato/streamdeck";
export declare class LaunchKiroFolderAction extends SingletonAction {
    onWillAppear(ev: WillAppearEvent): Promise<void>;
    onDidReceiveSettings(ev: DidReceiveSettingsEvent): Promise<void>;
    onKeyDown(ev: KeyDownEvent): Promise<void>;
    private addToRecent;
    static getRecentFolders(): Promise<string[]>;
}
