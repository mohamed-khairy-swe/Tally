export interface CounterValidationResult {
  readonly valid: boolean;
  readonly errors: Partial<
    Record<"name" | "startingValue" | "increment" | "target" | "unit" | "description", string>
  >;
}

export const MAX_SAFE_COUNTER_VALUE = 999_999_999;

export function validateCounterName(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return "Counter name cannot be empty.";
  }
  if (trimmed.length > 80) {
    return "Counter name must be 80 characters or less.";
  }
  return null;
}

export function validateStartingValue(val: number): string | null {
  if (!Number.isInteger(val)) {
    return "Starting value must be an integer.";
  }
  if (val < 0) {
    return "Starting value cannot be negative.";
  }
  if (val > MAX_SAFE_COUNTER_VALUE) {
    return `Starting value cannot exceed ${MAX_SAFE_COUNTER_VALUE.toLocaleString()}.`;
  }
  return null;
}

export function validateIncrement(val: number): string | null {
  if (!Number.isInteger(val)) {
    return "Increment must be an integer.";
  }
  if (val <= 0) {
    return "Increment must be greater than zero.";
  }
  if (val > MAX_SAFE_COUNTER_VALUE) {
    return `Increment cannot exceed ${MAX_SAFE_COUNTER_VALUE.toLocaleString()}.`;
  }
  return null;
}

export function validateTarget(val: number | null): string | null {
  if (val === null) {
    return null;
  }
  if (!Number.isInteger(val)) {
    return "Target must be an integer.";
  }
  if (val <= 0) {
    return "Target must be greater than zero.";
  }
  if (val > MAX_SAFE_COUNTER_VALUE) {
    return `Target cannot exceed ${MAX_SAFE_COUNTER_VALUE.toLocaleString()}.`;
  }
  return null;
}

export function validateCounterInput(input: {
  name: string;
  startingValue: number;
  increment: number;
  target: number | null;
  unit?: string | null;
  description?: string | null;
}): CounterValidationResult {
  const errors: CounterValidationResult["errors"] = {};

  const nameError = validateCounterName(input.name);
  if (nameError) errors.name = nameError;

  const startError = validateStartingValue(input.startingValue);
  if (startError) errors.startingValue = startError;

  const incError = validateIncrement(input.increment);
  if (incError) errors.increment = incError;

  const targetError = validateTarget(input.target);
  if (targetError) errors.target = targetError;

  if (input.unit && input.unit.trim().length > 30) {
    errors.unit = "Unit must be 30 characters or less.";
  }

  if (input.description && input.description.trim().length > 300) {
    errors.description = "Description must be 300 characters or less.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
