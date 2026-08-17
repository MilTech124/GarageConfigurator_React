import test from "node:test";
import assert from "node:assert/strict";
import { resolveFlashingColor } from "./flashingColors.js";

test("roof flashing follows inherited roof color until a custom color is selected", () => {
  assert.equal(resolveFlashingColor("roof", null, "#272C38"), "#272C38");
  assert.equal(resolveFlashingColor("custom", "#781416", "#272C38"), "#781416");
});

test("garage flashing has a stable fallback for textured garage finishes", () => {
  assert.equal(resolveFlashingColor("garage", null, null), "#272C38");
});
