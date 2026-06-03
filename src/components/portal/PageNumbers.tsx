import { cn } from "@/lib/utils";
import Link from "next/link";

function buildPages(currentPage: number, totalPages: number) {
  const pages: (number | "ellipsis")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push("ellipsis");
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push("ellipsis");
    pages.push(totalPages);
  }
  return pages;
}

const pageButtonBase =
  "inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm transition-colors";
const activeCls = "bg-brand text-brand-foreground font-medium";
const inactiveCls = "text-muted-foreground hover:bg-secondary hover:text-foreground";

export function PageNumbersLink({
  currentPage,
  totalPages,
  pageUrl,
}: {
  currentPage: number;
  totalPages: number;
  pageUrl: (page: number) => string;
}) {
  const pages = buildPages(currentPage, totalPages);
  return (
    <div className="flex items-center gap-1">
      {pages.map((p, idx) =>
        p === "ellipsis" ? (
          <span
            key={`ellipsis-${idx}`}
            className="inline-flex items-center justify-center w-8 h-8 text-muted-foreground text-xs"
          >
            ...
          </span>
        ) : (
          <Link
            key={p}
            href={pageUrl(p)}
            className={cn(pageButtonBase, p === currentPage ? activeCls : inactiveCls)}
          >
            {p}
          </Link>
        )
      )}
    </div>
  );
}

export function PageNumbersButton({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const pages = buildPages(currentPage, totalPages);
  return (
    <div className="flex items-center gap-1">
      {pages.map((p, idx) =>
        p === "ellipsis" ? (
          <span
            key={`ellipsis-${idx}`}
            className="inline-flex items-center justify-center w-8 h-8 text-muted-foreground text-xs"
          >
            ...
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={cn(pageButtonBase, p === currentPage ? activeCls : inactiveCls)}
          >
            {p}
          </button>
        )
      )}
    </div>
  );
}

export function PaginationLink({
  href,
  disabled,
  label,
  children,
}: {
  href: string;
  disabled: boolean;
  label: string;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <span
        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground/40 cursor-not-allowed"
        aria-label={label}
      >
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
      aria-label={label}
    >
      {children}
    </Link>
  );
}

export function PaginationButton({
  onClick,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        "inline-flex items-center justify-center w-8 h-8 rounded-lg transition-colors",
        disabled
          ? "text-muted-foreground/40 cursor-not-allowed"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}
