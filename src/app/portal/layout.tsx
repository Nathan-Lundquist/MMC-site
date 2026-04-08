import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PortalShell } from "@/components/portal/PortalShell";

export const metadata = {
  title: "MCC Portal",
};

// Dev bypass user — skip login in development
const DEV_USER = {
  id: "dev",
  name: "Mike Admin",
  email: "admin@mikescleancut.com",
  role: "ADMIN",
};

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isDev = process.env.NODE_ENV === "development";
  const session = await auth();

  if (!isDev && !session?.user) {
    redirect("/login");
  }

  const user = session?.user
    ? (session.user as { id: string; name?: string | null; email?: string | null; role: string })
    : DEV_USER;

  return (
    <PortalShell user={user}>
      {children}
    </PortalShell>
  );
}
