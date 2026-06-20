import { test, expect } from "bun:test";
import { resolveBackendName, type BackendProbe } from "./factory.js";

const probe = (p: Partial<BackendProbe>): BackendProbe => ({
  cmuxRunning: false,
  cmuxOnPath: false,
  running: [],
  ...p,
});

test("explicit app overrides detection", () => {
  expect(resolveBackendName("iTerm", probe({ cmuxRunning: true, cmuxOnPath: true }))).toBe("iTerm");
  expect(resolveBackendName("cmux", probe({}))).toBe("cmux");
});

test("auto prefers cmux when running and on PATH", () => {
  expect(
    resolveBackendName("auto", probe({ cmuxRunning: true, cmuxOnPath: true, running: ["iTerm"] }))
  ).toBe("cmux");
});

test("auto skips cmux when not on PATH and falls back to a running terminal", () => {
  expect(
    resolveBackendName("auto", probe({ cmuxRunning: true, cmuxOnPath: false, running: ["iTerm"] }))
  ).toBe("iTerm");
});

test("auto skips cmux when on PATH but not running", () => {
  expect(
    resolveBackendName("auto", probe({ cmuxRunning: false, cmuxOnPath: true, running: ["Warp"] }))
  ).toBe("Warp");
});

test("auto falls back through the terminal list in priority order", () => {
  expect(resolveBackendName("auto", probe({ running: ["Warp"] }))).toBe("Warp");
  expect(resolveBackendName("auto", probe({ running: ["Terminal", "Warp"] }))).toBe("Terminal");
  expect(resolveBackendName("auto", probe({ running: ["WezTerm", "Terminal"] }))).toBe("Terminal");
});

test("auto defaults to iTerm when nothing detected", () => {
  expect(resolveBackendName("auto", probe({}))).toBe("iTerm");
});
