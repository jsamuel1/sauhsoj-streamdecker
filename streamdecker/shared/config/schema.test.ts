import { test, expect } from "bun:test";
import { ConfigSchema, ButtonSchema, ActionId } from "./schema.js";

test("terminal.app accepts cmux", () => {
  const cfg = ConfigSchema.parse({ terminal: { app: "cmux" } });
  expect(cfg.terminal.app).toBe("cmux");
});

test("terminal.app still accepts existing terminals and auto", () => {
  for (const app of ["iTerm", "Terminal", "Warp", "WezTerm", "auto"] as const) {
    expect(ConfigSchema.parse({ terminal: { app } }).terminal.app).toBe(app);
  }
});

test("terminal.app defaults to auto", () => {
  expect(ConfigSchema.parse({}).terminal.app).toBe("auto");
});

test("terminal.app rejects unknown values", () => {
  expect(() => ConfigSchema.parse({ terminal: { app: "Hyper" } })).toThrow();
});

test("ActionId accepts the new target actions", () => {
  expect(ActionId.parse("target.launch")).toBe("target.launch");
  expect(ActionId.parse("target.focus")).toBe("target.focus");
});

test("ButtonSchema accepts target + folder for a target action", () => {
  const b = ButtonSchema.parse({
    position: 3,
    action: "target.launch",
    target: "claude-code",
    folder: "/tmp/proj",
  });
  expect(b.target).toBe("claude-code");
  expect(b.folder).toBe("/tmp/proj");
});

test("ButtonSchema parses a plain kiro button and rejects a bad target", () => {
  expect(ButtonSchema.parse({ position: 0, action: "kiro.focus" }).action).toBe("kiro.focus");
  expect(() => ButtonSchema.parse({ position: 0, action: "kiro.focus", target: "nope" })).toThrow();
});
