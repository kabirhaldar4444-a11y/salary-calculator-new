import test from "node:test";
import assert from "node:assert/strict";

import { calculateSalary, DEFAULT_INPUTS } from "../src/calculator.js";

const closeTo = (actual, expected, epsilon = 0.001) => {
  assert.ok(Math.abs(actual - expected) <= epsilon, `${actual} should be close to ${expected}`);
};

test("matches the supplied spreadsheet's default salary structure", () => {
  const result = calculateSalary(DEFAULT_INPUTS);

  closeTo(result.basicAnnual, 1_000_000);
  closeTo(result.hraAnnual, 400_000);
  closeTo(result.specialAnnual, 311_923.07692);
  closeTo(result.pfAnnual, 120_000);
  closeTo(result.gratuityAnnual, 48_076.92308);
  closeTo(result.allocatedAnnual, 2_000_000);
  closeTo(result.ctcDifference, 0);
});

test("applies the PF monthly ceiling when higher-wage PF is disabled", () => {
  const result = calculateSalary({ ...DEFAULT_INPUTS, pfHigherWages: false });

  closeTo(result.pfMonthlyWage, 25_000);
  closeTo(result.pfAnnual, 36_000);
});

test("removes employee and employer PF when PF is not applicable", () => {
  const result = calculateSalary({ ...DEFAULT_INPUTS, pfApplicable: false });

  closeTo(result.pfAnnual, 0);
  closeTo(result.pfMonthlyWage, 0);
  closeTo(result.ctcDifference, 0);
});

test("site allowance and other benefits reduce the balancing allowance", () => {
  const result = calculateSalary({
    ...DEFAULT_INPUTS,
    siteAllowance: 60_000,
    otherBenefits: 40_000,
  });

  closeTo(result.specialAnnual, 211_923.07692);
  closeTo(result.ctcDifference, 0);
});

test("flags a negative balancing allowance without hiding the over-allocation", () => {
  const result = calculateSalary({
    ...DEFAULT_INPUTS,
    basicPercent: 90,
    hraPercent: 50,
  });

  assert.equal(result.hasNegativeBalance, true);
  assert.ok(result.specialAnnual < 0);
  closeTo(result.ctcDifference, 0);
});

