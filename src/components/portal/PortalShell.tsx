"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  UserCog,
  Package,
  BarChart3,
  DollarSign,
  Table,
  Settings,
  Shield,
  Upload,
  CloudSnow,
  ClipboardPlus,
  PenLine,
  Trees,
  LogOut,
  Menu,
  X,
  Timer,
  CalendarClock,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

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
  adminOnly?: boolean;
  exact?: boolean;
}

interface NavSection {
  heading?: string;
  items: NavItem[];
  adminOnly?: boolean;
}

const NAV_SECTIONS: NavSection[] = [
  {
    items: [
      { href: "/portal", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    heading: "Landscaping",
    items: [
      { href: "/portal/landscape", label: "Active Jobs", icon: Trees, exact: true },
      { href: "/portal/landscape/log", label: "Log Work", icon: PenLine },
      { href: "/portal/jobs", label: "Jobs", icon: ClipboardList },
      { href: "/portal/materials", label: "Materials", icon: Package },
      { href: "/portal/customers", label: "All Customers", icon: Users },
      { href: "/portal/breakdown", label: "Breakdown", icon: BarChart3 },
      { href: "/portal/costing", label: "Job Costing", icon: DollarSign },
      { href: "/portal/costing/bulk", label: "Bulk Costing", icon: Table },
      { href: "/portal/landscape/settings", label: "Landscape Settings", icon: Settings, adminOnly: true },
    ],
  },
  {
    heading: "Snow Removal",
    items: [
      { href: "/portal/snow", label: "Storms", icon: CloudSnow },
      { href: "/portal/snow/log", label: "Log Visit", icon: ClipboardPlus },
      { href: "/portal/snow/settings", label: "Snow Settings", icon: Settings, adminOnly: true },
    ],
  },
  {
    heading: "Time",
    items: [
      { href: "/portal/time", label: "My Clock", icon: Timer, exact: true },
      { href: "/portal/time/log", label: "Time Log", icon: CalendarClock, adminOnly: true },
    ],
  },
  {
    heading: "Admin",
    adminOnly: true,
    items: [
      { href: "/portal/employees", label: "All Employees", icon: UserCog },
      { href: "/portal/upload", label: "Upload Data", icon: Upload },
      { href: "/portal/admin", label: "Current Admin", icon: Shield },
      { href: "/portal/settings", label: "Settings", icon: Settings },
    ],
  },
];

export function PortalShell({
  user,
  children,
}: {
  user: PortalUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "MC";

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-60 bg-card border-r border-border flex flex-col transition-transform duration-200 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand */}
        <div className="h-14 flex items-center gap-2 px-4 border-b border-border shrink-0">
          <div className="w-8 h-8 rounded-lg bg-brand text-brand-foreground font-display font-bold text-xs flex items-center justify-center">
            MC
          </div>
          <div>
            <div className="text-sm font-display font-semibold text-foreground leading-none">
              MCC Portal
            </div>
            <div className="text-[10px] text-muted-foreground">
              Clean Cut Ops
            </div>
          </div>
          <button
            className="ml-auto lg:hidden text-muted-foreground hover:text-foreground"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-2 px-2 overflow-y-auto">
          {NAV_SECTIONS.map((section, si) => {
            const isAdmin = section.adminOnly;
            if (isAdmin && !["ADMIN", "MANAGER"].includes(user.role)) return null;

            return (
              <div key={si} className={si > 0 ? "mt-4" : ""}>
                {section.heading && (
                  <div className="px-3 pt-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {section.heading}
                  </div>
                )}
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    if (item.adminOnly && !["ADMIN", "MANAGER"].includes(user.role)) return null;
                    const active =
                      item.href === "/portal" || item.exact
                        ? pathname === item.href
                        : pathname === item.href || pathname.startsWith(item.href + "/");
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
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
              </div>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="border-t border-border p-3">
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
      </aside>

      {/* Main content */}
      <div className="lg:pl-60">
        {/* Top bar (mobile) */}
        <header className="sticky top-0 z-30 h-14 bg-card/80 backdrop-blur border-b border-border flex items-center gap-3 px-4 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex-1" />
          <span className="text-xs text-muted-foreground hidden sm:block">
            {user.email}
          </span>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6 max-w-6xl">{children}</main>
      </div>
    </div>
  );
}
