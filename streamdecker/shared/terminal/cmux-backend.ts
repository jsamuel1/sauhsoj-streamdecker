import { execFile } from "child_process";
import { promisify } from "util";
import type { TerminalBackend, FocusResult, CmuxRunner } from "./types.js";
import {
  parseSurfaceRefs,
  parseCurrentSurfaceRef,
  parseFirstNotificationId,
  nextSurfaceRef,
} from "./parse.js";

const execFileAsync = promisify(execFile);

/** Default runner: invoke the `cmux` CLI via execFile (no shell, args passed as argv). */
const defaultRunner: CmuxRunner = async (args) => {
  const { stdout } = await execFileAsync("cmux", args);
  return stdout.trim();
};

export class CmuxBackend implements TerminalBackend {
  readonly name = "cmux" as const;
  private run: CmuxRunner;

  constructor(runner: CmuxRunner = defaultRunner) {
    this.run = runner;
  }

  async checkPermission(): Promise<boolean> {
    return true; // cmux uses its control socket; no AppleScript automation prompt
  }

  async focus(): Promise<FocusResult> {
    await this.run(["set-app-focus", "active"]);
    return "ok";
  }

  async send(text: string): Promise<void> {
    await this.run(["send", "--", `${text}\n`]);
  }

  async sendKey(key: string): Promise<void> {
    await this.run(["send-key", key]);
  }

  async openTab(command: string): Promise<void> {
    const created = await this.run(["new-surface", "--type", "terminal"]);
    const ref = parseSurfaceRefs(created)[0];
    const target = ref ? ["--surface", ref] : [];
    await this.run(["send", ...target, "--", `${command}\n`]);
  }

  async nextAlertTab(): Promise<FocusResult> {
    const out = await this.run(["list-notifications", "--json"]);
    const id = parseFirstNotificationId(out);
    if (!id) return "none";
    await this.run(["open-notification", "--id", id]);
    await this.run(["set-app-focus", "active"]);
    return "ok";
  }

  async cycleTab(): Promise<FocusResult> {
    const out = await this.run(["list-pane-surfaces"]);
    const refs = parseSurfaceRefs(out);
    const next = nextSurfaceRef(refs, parseCurrentSurfaceRef(out));
    if (!next) return "none";
    await this.run(["move-surface", "--surface", next, "--focus", "true"]);
    return "ok";
  }
}
