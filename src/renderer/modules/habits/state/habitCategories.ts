import type {
  Habit,
  HabitCategory,
} from "../types";

export function validateCategoryName(
  name: string,
): string | null {
  const trimmedName = name.trim();

  if (trimmedName.length === 0) {
    return "Category name cannot be empty.";
  }

  return null;
}

export interface CreateCategoryResult {
  readonly category: HabitCategory | null;
  readonly error: string | null;
}

export function createCategory(
  name: string,
): CreateCategoryResult {
  const error = validateCategoryName(name);

  if (error !== null) {
    return {
      category: null,
      error,
    };
  }

  return {
    category: {
      id: crypto.randomUUID(),
      name: name.trim(),
    },
    error: null,
  };
}

export interface RenameCategoryResult {
  readonly category: HabitCategory | null;
  readonly error: string | null;
}

export function renameCategory(
  category: HabitCategory,
  newName: string,
): RenameCategoryResult {
  const error = validateCategoryName(newName);

  if (error !== null) {
    return {
      category: null,
      error,
    };
  }

  return {
    category: {
      ...category,
      name: newName.trim(),
    },
    error: null,
  };
}

export function findCategory(
  categories: readonly HabitCategory[],
  categoryId: string,
): HabitCategory | null {
  return (
    categories.find(
      (category) =>
        category.id === categoryId,
    ) ?? null
  );
}

export function assignHabitToCategory(
  habit: Habit,
  category: HabitCategory,
): Habit {
  return {
    ...habit,
    categoryId: category.id,
  };
}

export function removeHabitFromCategory(
  habit: Habit,
): Habit {
  return {
    ...habit,
    categoryId: null,
  };
}

export interface DeleteCategoryResult {
  readonly categories: HabitCategory[];
  readonly habits: Habit[];
}

export function deleteCategory(
  categoryId: string,
  categories: readonly HabitCategory[],
  habits: readonly Habit[],
): DeleteCategoryResult {
  const categoryExists = categories.some(
    (category) =>
      category.id === categoryId,
  );

  if (!categoryExists) {
    return {
      categories: [...categories],
      habits: [...habits],
    };
  }

  const remainingCategories =
    categories.filter(
      (category) =>
        category.id !== categoryId,
    );

  const updatedHabits =
    habits.map((habit) =>
      habit.categoryId === categoryId
        ? {
            ...habit,
            categoryId: null,
          }
        : habit,
    );

  return {
    categories: remainingCategories,
    habits: updatedHabits,
  };
}

export function isValidCategoryReference(
  categoryId: string | null,
  categories: readonly HabitCategory[],
): boolean {
  if (categoryId === null) {
    return true;
  }

  return categories.some(
    (category) =>
      category.id === categoryId,
  );
}

export function validateHabitCategory(
  habit: Habit,
  categories: readonly HabitCategory[],
): string | null {
  if (
    !isValidCategoryReference(
      habit.categoryId,
      categories,
    )
  ) {
    return `Habit "${habit.name}" references a category that does not exist.`;
  }

  return null;
}

export function validateHabitCategories(
  habits: readonly Habit[],
  categories: readonly HabitCategory[],
): string[] {
  const errors: string[] = [];

  for (const habit of habits) {
    const error = validateHabitCategory(
      habit,
      categories,
    );

    if (error !== null) {
      errors.push(error);
    }
  }

  return errors;
}