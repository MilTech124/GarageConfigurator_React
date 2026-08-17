import test from "node:test";
import assert from "node:assert/strict";
import { getGutterLength, getGutterSegments } from "./gutters.js";

test("6x6 gable roof has two 6 m gutters", () => {
  const config = { width: 6, depth: 6, roof: "dwuspad" };
  assert.equal(getGutterSegments(config).length, 2);
  assert.equal(getGutterLength(config), 12);
});

test("single-slope roof has one gutter on its low edge", () => {
  const segments = getGutterSegments({ width: 6, depth: 5, roof: "spad tył" });
  assert.equal(segments.length, 1);
  assert.equal(segments[0].side, "tyl");
  assert.equal(segments[0].length, 6);
});

test("rotated gable roof uses width and extends only along its eaves", () => {
  const base = { width: 6, depth: 5, roof: "dwuspad przod-tyl", carport: true, carportWidth: 3 };
  assert.equal(getGutterLength({ ...base, carportSide: "lewo" }), 18);
  assert.equal(getGutterLength({ ...base, carportSide: "przod" }), 12);
});

test("single roof side extension changes gutter length only when parallel to eave", () => {
  const base = { width: 6, depth: 5, roof: "spad tyl", carport: true, carportWidth: 2 };
  assert.equal(getGutterLength({ ...base, carportSide: "lewo" }), 8);
  assert.equal(getGutterLength({ ...base, carportSide: "tyl" }), 6);
});

test("carport on a slope side moves the gutter to the outer roof edge", () => {
  const [left] = getGutterSegments({
    width: 6,
    depth: 5,
    roof: "dwuspad",
    carport: true,
    carportWidth: 2,
    carportSide: "lewo",
  });
  assert.equal(left.z, 5);

  const [back] = getGutterSegments({
    width: 6,
    depth: 5,
    roof: "spad tyl",
    carport: true,
    carportWidth: 2,
    carportSide: "tyl",
  });
  assert.equal(back.x, -4.5);
});
