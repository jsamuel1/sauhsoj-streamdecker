import { test, expect } from "bun:test";
import { ConfigSchema } from "./schema.js";

test("terminal.app accepts cmux", () => {
  const cfg = ConfigSchema.parse({ terminal: { app: "cmux" } });
  expect(cfg.terminal.app).toBe("cmux");
});

test("terminal.app still accepts existing terminals and auto", () => {
  for (const app of ["iTerm", "Terminal", "Warp", "WezTerm", "auto"]) {
    expect(ConfigSchema.parse({ terminal: { app } }).terminal.app).toBe(app);
  }
});

test("terminal.app defaults to auto", () => {
  expect(ConfigSchema.parse({}).terminal.app).toBe("auto");
});

test("terminal.app rejects unknown values", () => {
  expect(() => ConfigSchema.parse({ terminal: { app: "Hyper" } })).toThrow();
});
