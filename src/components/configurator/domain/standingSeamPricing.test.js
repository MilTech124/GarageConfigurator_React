import test from "node:test";
import assert from "node:assert/strict";
import { usesStandingSeamPrice } from "./standingSeamPricing.js";

test("uses standing-seam pricing for standing-seam walls only", () => {
  assert.equal(
    usesStandingSeamPrice({ emboss: "na_rabek", roofType: "trapezowa" }),
    true
  );
});

test("uses standing-seam pricing for a standing-seam roof only", () => {
  assert.equal(
    usesStandingSeamPrice({ emboss: "waskie", roofType: "na_rabek" }),
    true
  );
});

test("uses standing-seam pricing once when walls and roof both use it", () => {
  assert.equal(
    usesStandingSeamPrice({ emboss: "na_rabek", roofType: "na_rabek" }),
    true
  );
});

test("keeps standard pricing when standing seam is not selected", () => {
  assert.equal(
    usesStandingSeamPrice({ emboss: "szerokie", roofType: "blachodachówka" }),
    false
  );
});
