import { SingletonAction, WillAppearEvent, WillDisappearEvent } from "@elgato/streamdeck";
export declare class KiroStatusAction extends SingletonAction {
    private intervalId;
    onWillAppear(ev: WillAppearEvent): Promise<void>;
    onWillDisappear(_ev: WillDisappearEvent): Promise<void>;
    private updateStatus;
    private getCurrentKiroStatus;
    private parseTitle;
}
