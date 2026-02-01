import { z } from "zod";
export declare const ActionId: z.ZodEnum<["kiro.focus", "kiro.cycle", "kiro.alert", "kiro.launch", "kiro.yes", "kiro.no", "kiro.trust", "kiro.agent", "kiro.agent.picker"]>;
export type ActionId = z.infer<typeof ActionId>;
export declare const ButtonSchema: z.ZodObject<{
    position: z.ZodNumber;
    action: z.ZodEnum<["kiro.focus", "kiro.cycle", "kiro.alert", "kiro.launch", "kiro.yes", "kiro.no", "kiro.trust", "kiro.agent", "kiro.agent.picker"]>;
    icon: z.ZodOptional<z.ZodString>;
    label: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    position: number;
    action: "kiro.focus" | "kiro.cycle" | "kiro.alert" | "kiro.launch" | "kiro.yes" | "kiro.no" | "kiro.trust" | "kiro.agent" | "kiro.agent.picker";
    icon?: string | undefined;
    label?: string | undefined;
}, {
    position: number;
    action: "kiro.focus" | "kiro.cycle" | "kiro.alert" | "kiro.launch" | "kiro.yes" | "kiro.no" | "kiro.trust" | "kiro.agent" | "kiro.agent.picker";
    icon?: string | undefined;
    label?: string | undefined;
}>;
export type Button = z.infer<typeof ButtonSchema>;
export declare const DeviceSchema: z.ZodObject<{
    type: z.ZodDefault<z.ZodEnum<["neo", "mini"]>>;
    brightness: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    type: "neo" | "mini";
    brightness: number;
}, {
    type?: "neo" | "mini" | undefined;
    brightness?: number | undefined;
}>;
export declare const TerminalSchema: z.ZodObject<{
    app: z.ZodDefault<z.ZodEnum<["iTerm", "Terminal", "Warp", "WezTerm", "auto"]>>;
    detectCommand: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    app: "iTerm" | "Terminal" | "Warp" | "WezTerm" | "auto";
    detectCommand: string;
}, {
    app?: "iTerm" | "Terminal" | "Warp" | "WezTerm" | "auto" | undefined;
    detectCommand?: string | undefined;
}>;
export declare const ThemeSchema: z.ZodObject<{
    accentColor: z.ZodDefault<z.ZodString>;
    backgroundColor: z.ZodDefault<z.ZodString>;
    textColor: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    accentColor: string;
    backgroundColor: string;
    textColor: string;
}, {
    accentColor?: string | undefined;
    backgroundColor?: string | undefined;
    textColor?: string | undefined;
}>;
export declare const InfoBarSchema: z.ZodObject<{
    sources: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    updateInterval: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    sources: string[];
    updateInterval: number;
}, {
    sources?: string[] | undefined;
    updateInterval?: number | undefined;
}>;
export declare const AgentsSchema: z.ZodObject<{
    favorites: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    shortcuts: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
    recent: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    favorites: string[];
    shortcuts: Record<string, string>;
    recent: string[];
}, {
    favorites?: string[] | undefined;
    shortcuts?: Record<string, string> | undefined;
    recent?: string[] | undefined;
}>;
export declare const ConfigSchema: z.ZodObject<{
    mode: z.ZodDefault<z.ZodEnum<["standalone", "btt", "elgato"]>>;
    device: z.ZodDefault<z.ZodObject<{
        type: z.ZodDefault<z.ZodEnum<["neo", "mini"]>>;
        brightness: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        type: "neo" | "mini";
        brightness: number;
    }, {
        type?: "neo" | "mini" | undefined;
        brightness?: number | undefined;
    }>>;
    buttons: z.ZodDefault<z.ZodArray<z.ZodObject<{
        position: z.ZodNumber;
        action: z.ZodEnum<["kiro.focus", "kiro.cycle", "kiro.alert", "kiro.launch", "kiro.yes", "kiro.no", "kiro.trust", "kiro.agent", "kiro.agent.picker"]>;
        icon: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        position: number;
        action: "kiro.focus" | "kiro.cycle" | "kiro.alert" | "kiro.launch" | "kiro.yes" | "kiro.no" | "kiro.trust" | "kiro.agent" | "kiro.agent.picker";
        icon?: string | undefined;
        label?: string | undefined;
    }, {
        position: number;
        action: "kiro.focus" | "kiro.cycle" | "kiro.alert" | "kiro.launch" | "kiro.yes" | "kiro.no" | "kiro.trust" | "kiro.agent" | "kiro.agent.picker";
        icon?: string | undefined;
        label?: string | undefined;
    }>, "many">>;
    terminal: z.ZodDefault<z.ZodObject<{
        app: z.ZodDefault<z.ZodEnum<["iTerm", "Terminal", "Warp", "WezTerm", "auto"]>>;
        detectCommand: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        app: "iTerm" | "Terminal" | "Warp" | "WezTerm" | "auto";
        detectCommand: string;
    }, {
        app?: "iTerm" | "Terminal" | "Warp" | "WezTerm" | "auto" | undefined;
        detectCommand?: string | undefined;
    }>>;
    theme: z.ZodOptional<z.ZodObject<{
        accentColor: z.ZodDefault<z.ZodString>;
        backgroundColor: z.ZodDefault<z.ZodString>;
        textColor: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        accentColor: string;
        backgroundColor: string;
        textColor: string;
    }, {
        accentColor?: string | undefined;
        backgroundColor?: string | undefined;
        textColor?: string | undefined;
    }>>;
    infoBar: z.ZodOptional<z.ZodObject<{
        sources: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        updateInterval: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        sources: string[];
        updateInterval: number;
    }, {
        sources?: string[] | undefined;
        updateInterval?: number | undefined;
    }>>;
    agents: z.ZodDefault<z.ZodObject<{
        favorites: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        shortcuts: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
        recent: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        favorites: string[];
        shortcuts: Record<string, string>;
        recent: string[];
    }, {
        favorites?: string[] | undefined;
        shortcuts?: Record<string, string> | undefined;
        recent?: string[] | undefined;
    }>>;
    launchAtLogin: z.ZodDefault<z.ZodBoolean>;
    firstRun: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    agents: {
        favorites: string[];
        shortcuts: Record<string, string>;
        recent: string[];
    };
    mode: "standalone" | "btt" | "elgato";
    device: {
        type: "neo" | "mini";
        brightness: number;
    };
    buttons: {
        position: number;
        action: "kiro.focus" | "kiro.cycle" | "kiro.alert" | "kiro.launch" | "kiro.yes" | "kiro.no" | "kiro.trust" | "kiro.agent" | "kiro.agent.picker";
        icon?: string | undefined;
        label?: string | undefined;
    }[];
    terminal: {
        app: "iTerm" | "Terminal" | "Warp" | "WezTerm" | "auto";
        detectCommand: string;
    };
    launchAtLogin: boolean;
    firstRun: boolean;
    theme?: {
        accentColor: string;
        backgroundColor: string;
        textColor: string;
    } | undefined;
    infoBar?: {
        sources: string[];
        updateInterval: number;
    } | undefined;
}, {
    agents?: {
        favorites?: string[] | undefined;
        shortcuts?: Record<string, string> | undefined;
        recent?: string[] | undefined;
    } | undefined;
    mode?: "standalone" | "btt" | "elgato" | undefined;
    device?: {
        type?: "neo" | "mini" | undefined;
        brightness?: number | undefined;
    } | undefined;
    buttons?: {
        position: number;
        action: "kiro.focus" | "kiro.cycle" | "kiro.alert" | "kiro.launch" | "kiro.yes" | "kiro.no" | "kiro.trust" | "kiro.agent" | "kiro.agent.picker";
        icon?: string | undefined;
        label?: string | undefined;
    }[] | undefined;
    terminal?: {
        app?: "iTerm" | "Terminal" | "Warp" | "WezTerm" | "auto" | undefined;
        detectCommand?: string | undefined;
    } | undefined;
    theme?: {
        accentColor?: string | undefined;
        backgroundColor?: string | undefined;
        textColor?: string | undefined;
    } | undefined;
    infoBar?: {
        sources?: string[] | undefined;
        updateInterval?: number | undefined;
    } | undefined;
    launchAtLogin?: boolean | undefined;
    firstRun?: boolean | undefined;
}>;
export type Config = z.infer<typeof ConfigSchema>;
export declare function getDefaultButtons(deviceType: "neo" | "mini"): Button[];
export declare function validateButtonsForDevice(buttons: Button[], deviceType: "neo" | "mini"): boolean;
