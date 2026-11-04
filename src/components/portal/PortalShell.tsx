"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { confirmDiscardUnsavedChanges } from "@/lib/unsaved-changes-guard";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  UserCog,
  Package,
  BarChart3,
  DollarSign,
  Settings,
  Shield,
  Upload,
  CloudSnow,
  ClipboardPlus,
  PenLine,
  LogOut,
  Menu,
  ChevronDown,
  Timer,
  CalendarClock,
  Tractor,
  FileBarChart,
  Kanban,
  Leaf,
  MessageSquarePlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { ChangeRequestWidget } from "@/components/portal/ChangeRequestWidget";
import { CHANGE_REQUEST_ROLES, MANAGER_VISIBLE_ROLES } from "@/lib/constants";
import { useState } from "react";

interface PortalUser {
  id: string;
  name?: string | null;
  email?: string | null;
  role: string;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** When set, only these roles see this item. Omit to show it to everyone. */
  allowedRoles?: readonly string[];
  exact?: boolean;
}

interface NavSection {
  /** Sections without a heading render as flat top-level links; headed sections render as a dropdown. */
  heading?: string;
  items: NavItem[];
  /** When set, only these roles see this section. Omit to show it to everyone. */
  allowedRoles?: readonly string[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    items: [
      { href: "/portal", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { href: "/portal/board", label: "Board", icon: Kanban, exact: true },
      { href: "/portal/reports", label: "Reports", icon: FileBarChart },
    ],
  },
  {
    heading: "Landscape",
    items: [
      { href: "/portal/landscape/log", label: "Log Work", icon: PenLine },
      { href: "/portal/jobs", label: "Jobs", icon: ClipboardList },
      { href: "/portal/materials", label: "Materials", icon: Package },
      { href: "/portal/customers", label: "All Customers", icon: Users },
      { href: "/portal/breakdown", label: "Breakdown", icon: BarChart3 },
      { href: "/portal/costing", label: "Costing", icon: DollarSign },
      { href: "/portal/landscape/settings", label: "Landscape Settings", icon: Settings, allowedRoles: MANAGER_VISIBLE_ROLES },
    ],
  },
  {
    heading: "Clean Ups",
    items: [
      { href: "/portal/cleanups", label: "Active Jobs", icon: Leaf, exact: true },
      { href: "/portal/cleanups/log", label: "Log Work", icon: PenLine },
    ],
  },
  {
    heading: "Winter",
    items: [
      { href: "/portal/snow", label: "Storms", icon: CloudSnow },
      { href: "/portal/snow/log", label: "Log Visit", icon: ClipboardPlus },
      { href: "/portal/snow/settings", label: "Snow Settings", icon: Settings, allowedRoles: MANAGER_VISIBLE_ROLES },
    ],
  },
  {
    heading: "Time",
    items: [
      { href: "/portal/time", label: "My Clock", icon: Timer, exact: true },
      { href: "/portal/time/log", label: "Time Log", icon: CalendarClock, allowedRoles: MANAGER_VISIBLE_ROLES },
    ],
  },
  {
    heading: "Admin",
    allowedRoles: MANAGER_VISIBLE_ROLES,
    items: [
      { href: "/portal/machines", label: "Maintenance", icon: Tractor },
      { href: "/portal/employees", label: "All Employees", icon: UserCog },
      { href: "/portal/change-requests", label: "Change Requests", icon: MessageSquarePlus, allowedRoles: CHANGE_REQUEST_ROLES },
      { href: "/portal/upload", label: "Upload Data", icon: Upload },
      { href: "/portal/admin", label: "Current Admin", icon: Shield },
      { href: "/portal/settings", label: "Settings", icon: Settings },
    ],
  },
];

function isActive(pathname: string, item: NavItem) {
  return item.exact
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(item.href + "/");
}

function visibleSections(role: string) {
  return NAV_SECTIONS.filter((s) => !s.allowedRoles || s.allowedRoles.includes(role)).map((s) => ({
    ...s,
    items: s.items.filter((i) => !i.allowedRoles || i.allowedRoles.includes(role)),
  }));
}

export function PortalShell({
  user,
  children,
}: {
  user: PortalUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const sections = visibleSections(user.role);

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "MC";

  function handleNavigate(e: React.MouseEvent) {
    if (!confirmDiscardUnsavedChanges()) {
      e.preventDefault();
      return;
    }
    setMobileNavOpen(false);
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-30 h-14 bg-card/80 backdrop-blur border-b border-border">
        <div className="h-full flex items-center gap-2 px-4 lg:px-6">
          {/* Brand */}
          <Link href="/portal" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-brand text-brand-foreground font-display font-bold text-xs flex items-center justify-center">
              MC
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-display font-semibold text-foreground leading-none">
                MCC Portal
              </div>
              <div className="text-[10px] text-muted-foreground">
                Clean Cut Ops
              </div>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1 ml-6">
            {sections.map((section, si) => {
              if (section.items.length === 0) return null;

              if (!section.heading) {
                return section.items.map((item) => {
                  const active = isActive(pathname, item);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={handleNavigate}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        active
                          ? "bg-brand/10 text-brand"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                      )}
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      {item.label}
                    </Link>
                  );
                });
              }

              const sectionActive = section.items.some((item) => isActive(pathname, item));

              return (
                <DropdownMenu key={si}>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium outline-none transition-colors",
                        sectionActive
                          ? "bg-brand/10 text-brand"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                      )}
                    >
                      {section.heading}
                      <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-60" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {section.items.map((item) => {
                      const active = isActive(pathname, item);
                      return (
                        <DropdownMenuItem key={item.href} asChild>
                          <Link
                            href={item.href}
                            onClick={handleNavigate}
                            className={cn(active && "bg-brand/10 text-brand")}
                          >
                            <item.icon className="w-4 h-4 shrink-0" />
                            {item.label}
                          </Link>
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            })}
          </nav>

          <div className="flex-1" />

          <span className="text-xs text-muted-foreground hidden xl:block mr-1">
            {user.email}
          </span>

          <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-border ml-1">
            <div className="w-8 h-8 rounded-full bg-brand/10 text-brand text-xs font-bold flex items-center justify-center shrink-0">
              {initials}
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-muted-foreground hover:text-destructive transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile menu trigger */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileNavOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Mobile nav */}
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="border-b border-border">
            <SheetTitle>MCC Portal</SheetTitle>
          </SheetHeader>

          <nav className="flex-1 overflow-y-auto px-3 py-2">
            {sections.map((section, si) => {
              if (section.items.length === 0) return null;

              if (!section.heading) {
                return (
                  <div key={si} className="space-y-0.5 pb-2">
                    {section.items.map((item) => {
                      const active = isActive(pathname, item);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={handleNavigate}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                            active
                              ? "bg-brand/10 text-brand"
                              : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                          )}
                        >
                          <item.icon className="w-4 h-4 shrink-0" />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                );
              }

              const sectionActive = section.items.some((item) => isActive(pathname, item));

              return (
                <Accordion key={si} type="single" collapsible defaultValue={sectionActive ? `s${si}` : undefined}>
                  <AccordionItem value={`s${si}`} className="border-none">
                    <AccordionTrigger className="px-3 py-2 text-sm hover:no-underline">
                      {section.heading}
                    </AccordionTrigger>
                    <AccordionContent className="pb-1 pl-1">
                      <div className="space-y-0.5">
                        {section.items.map((item) => {
                          const active = isActive(pathname, item);
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={handleNavigate}
                              className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                                active
                                  ? "bg-brand/10 text-brand"
                                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                              )}
                            >
                              <item.icon className="w-4 h-4 shrink-0" />
                              {item.label}
                            </Link>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              );
            })}
          </nav>

          <div className="border-t border-border p-3 mt-auto">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-brand/10 text-brand text-xs font-bold flex items-center justify-center shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground truncate">
                  {user.name || "Employee"}
                </div>
                <div className="text-[10px] text-muted-foreground capitalize">
                  {user.role.toLowerCase()}
                </div>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="text-muted-foreground hover:text-destructive transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Page content */}
      <main className="p-4 lg:p-6 max-w-6xl">{children}</main>

      {(CHANGE_REQUEST_ROLES as readonly string[]).includes(user.role) && <ChangeRequestWidget />}
    </div>
  );
}
