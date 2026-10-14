import { JobCategory } from "@prisma/client";

function formatCategory(cat: string) {
  return cat
    .split("_")
    .map((w) => w[0] + w.slice(1).toLowerCase())
    .join(" ");
}

export const JOB_CATEGORIES = Object.values(JobCategory).map((value) => ({
  value,
  label: formatCategory(value),
}));

export const CLEAN_UP_CATEGORY_VALUES = ["FALL_CLEANUP", "SPRING_CLEANUP"] as const;

// Season-scoped: picking Fall/Spring Clean Up here would make the job
// immediately vanish from the Spring & Summer views (it belongs under Clean Ups instead).
export const SPRING_SUMMER_CATEGORIES = JOB_CATEGORIES.filter(
  (c) => !(CLEAN_UP_CATEGORY_VALUES as readonly string[]).includes(c.value)
);

export const CLEAN_UP_CATEGORIES = JOB_CATEGORIES.filter((c) =>
  (CLEAN_UP_CATEGORY_VALUES as readonly string[]).includes(c.value)
);
