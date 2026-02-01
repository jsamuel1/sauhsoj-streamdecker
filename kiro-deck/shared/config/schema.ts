import { z } from "zod";

// Action IDs available in the system
export const ActionId = z.enum([
  "kiro.focus",
  "kiro.cycle",
  "kiro.alert",
  "kiro.launch",
  "kiro.yes",
  "kiro.no",
  "kiro.trust",
  "kiro.agent",
  "kiro.agent.picker",
]);

export type ActionId = z.infer<typeof ActionId>;

// Button configuration
export const ButtonSchema = z.object({
  position: z.number().min(0).max(7),
  action: ActionId,
  icon: z.string().optional(),
  label: z.string().optional(),
});

export type Button = z.infer<typeof ButtonSchema>;

// Device configuration
export const DeviceSchema = z.object({
  type: z.enum(["neo", "mini"]).default("neo"),
  brightness: z.number().min(0).max(100).default(80),
});

// Terminal configuration
export const TerminalSchema = z.object({
  app: z.enum(["iTerm", "Terminal", "Warp", "WezTerm", "auto"]).default("auto"),
  detectCommand: z.string().default("kiro-cli"),
});

// Theme configuration (standalone mode only)
export const ThemeSchema = z.object({
  accentColor: z.string().default("#9046ff"),
  backgroundColor: z.string().default("#18181b"),
  textColor: z.string().default("#ffffff"),
});

// Info bar configuration (standalone mode only)
export const InfoBarSchema = z.object({
  sources: z.array(z.string()).default(["kiro", "calendar", "time"]),
  updateInterval: z.number().default(30000),
});

// Agent configuration
export const AgentsSchema = z.object({
  favorites: z.array(z.string()).default(["default", "jupyter", "git", "notes"]),
  shortcuts: z.record(z.string()).default({}),
  recent: z.array(z.string()).default([]),
});

// Default button layouts
const DEFAULT_NEO_BUTTONS: Button[] = [
  { position: 0, action: "kiro.focus", icon: "kiro-focus" },
  { position: 1, action: "kiro.cycle", icon: "kiro-cycle" },
  { position: 2, action: "kiro.alert", icon: "kiro-alert" },
  { position: 3, action: "kiro.launch", icon: "kiro-launch" },
  { position: 4, action: "kiro.yes", icon: "kiro-yes" },
  { position: 5, action: "kiro.no", icon: "kiro-no" },
  { position: 6, action: "kiro.trust", icon: "kiro-trust" },
  { position: 7, action: "kiro.agent", icon: "kiro-agent" },
];

const DEFAULT_MINI_BUTTONS: Button[] = [
  { position: 0, action: "kiro.yes", icon: "kiro-yes" },
  { position: 1, action: "kiro.no", icon: "kiro-no" },
  { position: 2, action: "kiro.trust", icon: "kiro-trust" },
  { position: 3, action: "kiro.focus", icon: "kiro-focus" },
  { position: 4, action: "kiro.agent", icon: "kiro-agent" },
  { position: 5, action: "kiro.launch", icon: "kiro-launch" },
];

// Main config schema
export const ConfigSchema = z.object({
  mode: z.enum(["standalone", "btt", "elgato"]).default("standalone"),
  device: DeviceSchema.default({}),
  buttons: z.array(ButtonSchema).default(DEFAULT_NEO_BUTTONS),
  terminal: TerminalSchema.default({}),
  theme: ThemeSchema.optional(),
  infoBar: InfoBarSchema.optional(),
  agents: AgentsSchema.default({}),
  launchAtLogin: z.boolean().default(true),
  firstRun: z.boolean().default(true),
});

export type Config = z.infer<typeof ConfigSchema>;

// Get default buttons for device type
export function getDefaultButtons(deviceType: "neo" | "mini"): Button[] {
  return deviceType === "neo" ? DEFAULT_NEO_BUTTONS : DEFAULT_MINI_BUTTONS;
}

// Validate button count for device
export function validateButtonsForDevice(buttons: Button[], deviceType: "neo" | "mini"): boolean {
  const maxButtons = deviceType === "neo" ? 8 : 6;
  return buttons.every((b) => b.position < maxButtons);
}
