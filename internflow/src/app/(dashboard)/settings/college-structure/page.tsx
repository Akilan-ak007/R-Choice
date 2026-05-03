import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCollegeHierarchy } from "@/app/actions/hierarchy";
import CollegeStructureClient from "./CollegeStructureClient";

export default async function CollegeStructurePage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "dean") {
    redirect("/");
  }

  const hierarchy = await getCollegeHierarchy();

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>College Structure Management</h1>
        <p>Add, edit, or remove Schools, Sections, Courses, and Departments so the academic structure stays aligned with your real campus hierarchy.</p>
      </div>
      <CollegeStructureClient initialHierarchy={hierarchy as any[]} />
    </div>
  );
}
