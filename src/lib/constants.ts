export const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-secondary text-secondary-foreground",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  INVOICED: "bg-brand/10 text-brand",
  PAID: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-destructive/10 text-destructive",
  OPEN: "bg-amber-100 text-amber-800",
  DONE: "bg-emerald-100 text-emerald-800",
};

export const JOB_CATEGORIES = [
  { value: "FALL_CLEANUP", label: "Fall Clean Up" },
  { value: "SPRING_CLEANUP", label: "Spring Clean Up" },
  { value: "FULL_LANDSCAPE", label: "Full Landscape" },
  { value: "HEDGE_TRIMMING", label: "Hedge Trimming" },
  { value: "SOD", label: "Sod" },
  { value: "MULCH_TOPSOIL", label: "Mulch & Topsoil" },
  { value: "DEBRIS_REMOVAL", label: "Debris Removal" },
  { value: "TREE_SHRUB_INSTALL", label: "Tree & Shrub Install" },
  { value: "DRAIN", label: "Drain" },
  { value: "ROCK_RIVER_ROCK", label: "Rock / River Rock" },
  { value: "RETAINING_WALL", label: "Retaining Wall" },
  { value: "PATIO_WALKWAY", label: "Patio / Walkway" },
  { value: "GRADE_WORK", label: "Grade Work" },
  { value: "SPRINKLER", label: "Sprinkler" },
  { value: "LIGHTING", label: "Lighting" },
  { value: "SNOW_PLOW", label: "Snow Plow" },
  { value: "SNOW_SALT", label: "Snow Salt" },
  { value: "LAWN_CUT", label: "Lawn Cut" },
  { value: "OTHER", label: "Other" },
];

export const STATUSES = [
  { value: "DRAFT", label: "Draft" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "INVOICED", label: "Invoiced" },
  { value: "PAID", label: "Paid" },
  { value: "CANCELLED", label: "Cancelled" },
];

/** Maximum file upload size in bytes (10 MB) */
export const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;

export const RECEIPT_TYPES = [
  { value: "MATERIALS", label: "Materials" },
  { value: "FUEL", label: "Fuel" },
  { value: "DUMP_FEE", label: "Dump Fee" },
  { value: "OTHER", label: "Other" },
];

export const RECEIPT_TYPE_COLORS: Record<string, string> = {
  MATERIALS: "bg-blue-100 text-blue-800",
  FUEL: "bg-amber-100 text-amber-800",
  DUMP_FEE: "bg-purple-100 text-purple-800",
  OTHER: "bg-secondary text-secondary-foreground",
};

/** Roles allowed to delete a receipt (shared by the API route and the client UI) */
export const RECEIPT_DELETE_ROLES = ["ADMIN", "MANAGER"] as const;

/** Roles allowed to see admin-only portal nav items (shared across PortalShell's nav config) */
export const MANAGER_VISIBLE_ROLES = ["ADMIN", "MANAGER"] as const;

/** Roles allowed to submit or review portal change requests (ADMIN only, deliberately excludes MANAGER) */
export const CHANGE_REQUEST_ROLES = ["ADMIN"] as const;

/** Max length for a change-request note, enforced client-side and server-side */
export const MAX_CHANGE_REQUEST_NOTE_LENGTH = 2000;

/** Roles allowed to move/advance a job card on the board, and to create jobs from it */
export const BOARD_MOVE_ROLES = ["ADMIN", "MANAGER", "FOREMAN"] as const;

/** Board columns, in display order, mapped to the WorkOrder statuses they represent */
export const BOARD_COLUMNS = [
  { status: "DRAFT", label: "To Schedule" },
  { status: "IN_PROGRESS", label: "In Progress" },
  { status: "COMPLETED", label: "Done" },
] as const;

/** How far back a COMPLETED job's boardStatusChangedAt can be and still show in the Done column */
export const BOARD_DONE_WINDOW_DAYS = 30;
