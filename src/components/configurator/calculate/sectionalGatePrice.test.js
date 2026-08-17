import test from "node:test";
import assert from "node:assert/strict";
import { calculateGateAdjustments, calculateSectionalGateAdjustment, findSectionalGatePrice } from "./sectionalGatePrice.js";

const prices = [
  { widthMm: 2200, heightMm: 2000, price: 2500 },
  { widthMm: 2300, heightMm: 2000, price: 2500 },
];

test("sectional price lookup requires an exact dimension", () => {
  assert.equal(findSectionalGatePrice(prices, 2.2, 2000), 2500);
  assert.equal(findSectionalGatePrice(prices, 2.25, 2000), null);
  assert.equal(findSectionalGatePrice(prices, 2.2, 2120), null);
});

test("sectional gate always includes the CAME drive in its table price", () => {
  assert.deepEqual(calculateSectionalGateAdjustment({
    gateType: "segmentowa",
    gateWidth: 2.2,
    gateHeight: 2000,
    gateDrive: "none",
    prices,
    includedUpAndOverGate: 400,
  }), { valid: true, amount: 2100 });
});

test("mixed gates sum independently and sectional drive is not counted as general automation", () => {
  assert.deepEqual(calculateGateAdjustments({
    gates: [
      { type: "segmentowa", width: 2.2, height: 200, drive: "came" },
      { type: "uchylna", width: 3, height: 200 },
      { type: "dwuskrzydłowa", width: 3, height: 200 },
    ],
    prices,
    includedUpAndOverGate: 400,
    doubleLeafAdjustment: -400,
  }), { amount: 1700, valid: true, nonSectionalCount: 2 });
});
