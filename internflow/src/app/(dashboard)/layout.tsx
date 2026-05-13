import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { CommandPalette } from "@/components/ui/CommandPalette";
import { DynamicIsland } from "@/components/ui/DynamicIsland";

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
      <>
        <CommandPalette />
        <DynamicIsland />
        {children}
      </>
    </DashboardShell>
  );
}
