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
