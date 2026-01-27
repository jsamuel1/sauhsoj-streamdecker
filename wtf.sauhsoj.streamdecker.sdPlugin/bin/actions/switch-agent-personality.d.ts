import { DidReceiveSettingsEvent, KeyDownEvent, SingletonAction, WillAppearEvent } from "@elgato/streamdeck";
export declare class SwitchAgentPersonalityAction extends SingletonAction {
    onWillAppear(ev: WillAppearEvent): Promise<void>;
    onDidReceiveSettings(ev: DidReceiveSettingsEvent): Promise<void>;
    onKeyDown(ev: KeyDownEvent): Promise<void>;
    private extractAgentName;
    static getAvailableAgents(): Promise<string[]>;
}
