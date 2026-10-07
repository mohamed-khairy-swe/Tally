import { describe, expect, it } from "vitest";
import {
  validateCounterInput,
  validateCounterName,
  validateIncrement,
  validateStartingValue,
  validateTarget,
} from "./counterValidation";

describe("validateCounterName", () => {
  it("accepts valid names", () => {
    expect(validateCounterName("Push-ups")).toBeNull();
  });

  it("rejects empty names", () => {
    expect(validateCounterName("")).not.toBeNull();
    expect(validateCounterName("    ")).not.toBeNull();
  });

  it("rejects names over 80 characters", () => {
    expect(validateCounterName("a".repeat(81))).not.toBeNull();
  });
});

describe("validateStartingValue", () => {
  it("accepts 0 and positive integers", () => {
    expect(validateStartingValue(0)).toBeNull();
    expect(validateStartingValue(100)).toBeNull();
  });

  it("rejects negative numbers and decimals", () => {
    expect(validateStartingValue(-1)).not.toBeNull();
    expect(validateStartingValue(1.5)).not.toBeNull();
  });
});

describe("validateIncrement", () => {
  it("accepts positive integers", () => {
    expect(validateIncrement(1)).toBeNull();
    expect(validateIncrement(10)).toBeNull();
  });

  it("rejects 0, negative numbers, and decimals", () => {
    expect(validateIncrement(0)).not.toBeNull();
    expect(validateIncrement(-5)).not.toBeNull();
    expect(validateIncrement(2.5)).not.toBeNull();
  });
});

describe("validateTarget", () => {
  it("accepts null and positive integers", () => {
    expect(validateTarget(null)).toBeNull();
    expect(validateTarget(50)).toBeNull();
  });

  it("rejects 0 and negative numbers", () => {
    expect(validateTarget(0)).not.toBeNull();
    expect(validateTarget(-10)).not.toBeNull();
  });
});

describe("validateCounterInput", () => {
  it("validates complete input", () => {
    const valid = validateCounterInput({
      name: "Water",
      startingValue: 0,
      increment: 1,
      target: 8,
      unit: "glasses",
    });
    expect(valid.valid).toBe(true);

    const invalid = validateCounterInput({
      name: "",
      startingValue: -1,
      increment: 0,
      target: 0,
    });
    expect(invalid.valid).toBe(false);
    expect(invalid.errors.name).toBeDefined();
    expect(invalid.errors.startingValue).toBeDefined();
    expect(invalid.errors.increment).toBeDefined();
    expect(invalid.errors.target).toBeDefined();
  });
});
