import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { authorityMappings, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import HierarchyClient from "./HierarchyClient";

export default async function HierarchyPage() {
  const session = await auth();
  const role = session?.user?.role;

  if (!role || !["principal", "dean", "hod", "mcr", "coe", "placement_head", "management_corporation"].includes(role)) {
    redirect("/");
  }

  // Fetch existing mappings
  const rawMappings = await db.select().from(authorityMappings);

  // Normalize nulls for safe client-side rendering
  const mappings = rawMappings.map((m) => ({
    id: m.id,
    school: m.school || null,
    section: m.section || null,
    course: m.course || null,
    programType: m.programType || "UG",
    department: m.department,
    year: m.year,
    tutorId: m.tutorId || null,
    placementCoordinatorId: m.placementCoordinatorId || null,
    hodId: m.hodId || null,
    deanId: m.deanId || null,
  }));

  // Fetch staff for dropdowns
  const tutors = await db
    .select({ id: users.id, firstName: users.firstName, lastName: users.lastName })
    .from(users)
    .where(eq(users.role, "tutor"));

  const coordinators = await db
    .select({ id: users.id, firstName: users.firstName, lastName: users.lastName })
    .from(users)
    .where(eq(users.role, "placement_coordinator"));

  const hods = await db
    .select({ id: users.id, firstName: users.firstName, lastName: users.lastName })
    .from(users)
    .where(eq(users.role, "hod"));

  const deans = await db
    .select({ id: users.id, firstName: users.firstName, lastName: users.lastName })
    .from(users)
    .where(eq(users.role, "dean"));

  const { getCollegeHierarchy } = await import("@/app/actions/hierarchy");
  const dynamicHierarchy = await getCollegeHierarchy();

  return (
    <HierarchyClient
      initialMappings={mappings}
      tutors={tutors}
      coordinators={coordinators}
      hods={hods}
      deans={deans}
      currentUserRole={role}
      collegeHierarchy={dynamicHierarchy}
    />
  );
}
