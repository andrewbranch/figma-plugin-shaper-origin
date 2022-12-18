import assert from "node:assert";
import { test } from "node:test";
import { RealDimension, Scalar } from "../src/dimensions";
import { tryEvaluate } from "../src/expressions";

function assertEqual(
  value: RealDimension | Scalar | undefined,
  expected: RealDimension | Scalar
) {
  assert.equal(value?.unit, expected.unit);
  if (Math.abs(value?.scalar! - expected.scalar) > 0.001) {
    assert.equal(value?.scalar, expected.scalar);
  }
}

test("math evaluator", () => {
  assertEqual(tryEvaluate("1 + 2"), { scalar: 3, unit: undefined });
  assertEqual(tryEvaluate("1 + 2 in"), { scalar: 3, unit: "in" });
  assertEqual(tryEvaluate("1 in + 2 in"), { scalar: 3, unit: "in" });
  assertEqual(tryEvaluate("1 in + 2"), { scalar: 3, unit: "in" });
  assertEqual(tryEvaluate("1 in + 2 mm"), { scalar: 1.0787, unit: "in" });
  assertEqual(tryEvaluate("1 in - 2 mm"), { scalar: 0.9213, unit: "in" });
  assertEqual(tryEvaluate("1 in * 2"), { scalar: 2, unit: "in" });
  assertEqual(tryEvaluate("1 in / 2"), { scalar: 0.5, unit: "in" });
  assertEqual(tryEvaluate("1in / 2in"), { scalar: 0.5, unit: undefined });
  assertEqual(tryEvaluate("1in / 2mm"), { scalar: 12.7, unit: undefined });

  assert.equal(tryEvaluate("1in * 2mm"), undefined);

  // this is weird but consistent
  assertEqual(tryEvaluate("1in + (2mm/4mm)"), { scalar: 1.5, unit: "in" });

  assertEqual(tryEvaluate("2 + 3 * 4"), { scalar: 14, unit: undefined });
  assertEqual(tryEvaluate("(2 + 3) * 4"), { scalar: 20, unit: undefined });
  assertEqual(tryEvaluate("2 + 3 * 4 in"), { scalar: 14, unit: "in" });
  assertEqual(tryEvaluate("(2 + 3)mm * 4"), { scalar: 20, unit: "mm" });
  assertEqual(tryEvaluate("(1in)mm"), { scalar: 25.4, unit: "mm" });
  assertEqual(tryEvaluate("1in/1mm"), { scalar: 25.4, unit: undefined });
  assertEqual(tryEvaluate("(2in + 3)mm / (4*2mm)in"), {
    scalar: 15.875,
    unit: undefined,
  });

  assertEqual(tryEvaluate("1 1/8"), { scalar: 1.125, unit: undefined });
  assertEqual(tryEvaluate("1 1/8in"), { scalar: 1.125, unit: "in" });
  assertEqual(tryEvaluate("1 1/8 in"), { scalar: 1.125, unit: "in" });
  assertEqual(tryEvaluate("1 1/8 in + 1 1/8 in"), { scalar: 2.25, unit: "in" });
});
