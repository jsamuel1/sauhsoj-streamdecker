import { test, expect } from "bun:test";
import { buildInitMessage, parseHelperLine, type MenuDef } from "./menubar-protocol.js";

const menu: MenuDef = {
  icon: "AAAA",
  tooltip: "Streamdecker",
  items: [
    { id: 0, title: "Streamdecker v1.0", enabled: false },
    { separator: true },
    { id: 2, title: "Configure...", enabled: true },
  ],
};

test("buildInitMessage serializes a single JSON line with no embedded newline", () => {
  const line = buildInitMessage(menu);
  expect(line.endsWith("\n")).toBe(true);
  expect(line.trimEnd().includes("\n")).toBe(false);
  const parsed = JSON.parse(line);
  expect(parsed.icon).toBe("AAAA");
  expect(parsed.tooltip).toBe("Streamdecker");
  expect(parsed.items).toHaveLength(3);
  expect(parsed.items[1]).toEqual({ separator: true });
  expect(parsed.items[2]).toEqual({ id: 2, title: "Configure...", enabled: true });
});

test("parseHelperLine parses a click event", () => {
  expect(parseHelperLine('{"type":"click","id":2}')).toEqual({ type: "click", id: 2 });
});

test("parseHelperLine parses a ready event", () => {
  expect(parseHelperLine('{"type":"ready"}')).toEqual({ type: "ready" });
});

test("parseHelperLine ignores blank lines and malformed JSON", () => {
  expect(parseHelperLine("")).toBeNull();
  expect(parseHelperLine("   ")).toBeNull();
  expect(parseHelperLine("not json")).toBeNull();
});

test("parseHelperLine ignores click without a numeric id", () => {
  expect(parseHelperLine('{"type":"click"}')).toBeNull();
  expect(parseHelperLine('{"type":"click","id":"x"}')).toBeNull();
});

test("parseHelperLine ignores unknown message types", () => {
  expect(parseHelperLine('{"type":"whatever"}')).toBeNull();
});
