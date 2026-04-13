import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  const user = session.user;

  return (
    <DashboardShell
      userName={user.name || "User"}
      userRole={user.role || "student"}
      userEmail={user.email || ""}
      userAvatar={user.image}
    >
      {children}
    </DashboardShell>
  );
}
